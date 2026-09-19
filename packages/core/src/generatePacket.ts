import { ulid } from "ulid";
import type { Intake, Packet, CompanyCatalog } from "./types";
import {
  type YMD,
  computeDeadlineYMD,
  ymdFromISODate,
  formatYMDEn,
  formatYMDHi,
} from "./dates";
import { formatInr, formatInrNumber } from "./money";
import { REMEDY_TEXT } from "./remedyText";
import { loadTemplateFile, fillSlots } from "./templateLoader";

const WHATSAPP_MAX_CHARS = 700;
const TRUNCATION_ELLIPSIS = "…";

/**
 * Fills the WhatsApp template and defensively enforces the PRD's ≤700-char
 * cap. If the filled text is over budget, shrink the *whatHappened* slot
 * value specifically (not the assembled string) so the closing
 * demand/deadline/escalation language is never cut off, then re-fill.
 */
function fillWhatsappWithinBudget(template: string, slots: Record<string, string>): string {
  const filled = fillSlots(template, slots);
  if (filled.length <= WHATSAPP_MAX_CHARS) {
    return filled;
  }
  const overBudget = filled.length - WHATSAPP_MAX_CHARS;
  const originalWhatHappened = slots.whatHappened ?? "";
  const targetLength = Math.max(
    0,
    originalWhatHappened.length - overBudget - TRUNCATION_ELLIPSIS.length
  );
  const truncatedWhatHappened =
    originalWhatHappened.slice(0, targetLength).trimEnd() + TRUNCATION_ELLIPSIS;
  const adjustedSlots = { ...slots, whatHappened: truncatedWhatHappened };
  return fillSlots(template, adjustedSlots);
}

const PORTAL_LINKS_ECOM = [
  {
    label: "National Consumer Helpline (NCH)",
    href: "https://consumerhelpline.gov.in/",
    help: "File a formal consumer complaint online.",
  },
  {
    label: "e-Daakhil / e-Jagriti",
    href: "https://e-daakhil.nic.in/",
    help: "File a case with the Consumer Commission.",
  },
];

const PORTAL_LINKS_UPI = [
  {
    label: "RBI Complaint Management System (CMS)",
    href: "https://cms.rbi.org.in/",
    help: "Escalate to the RBI Banking Ombudsman.",
  },
  {
    label: "NPCI UPI Help",
    href: "https://www.npci.org.in/what-we-do/upi/faqs",
    help: "UPI-specific dispute guidance.",
  },
];

/** The payment app or platform itself — e.g. "Google Pay", "Flipkart Internet Private Limited". */
function appLabel(intake: Intake, catalog: CompanyCatalog): string {
  if (intake.category === "upi") {
    return catalog[intake.platform]?.legalName ?? intake.platform;
  }
  return catalog[intake.platform]?.legalName ?? intake.companyName ?? intake.platform;
}

/**
 * Who the letter is addressed to. For ecommerce/food, the platform IS the
 * company. For UPI, the platform is just the payment app — the actual
 * recipient (a merchant, a shop, a person) comes from companyName.
 */
function recipientLabel(intake: Intake, catalog: CompanyCatalog): string {
  if (intake.category === "upi") {
    return intake.companyName ?? "the recipient";
  }
  return catalog[intake.platform]?.legalName ?? intake.companyName ?? intake.platform;
}

function buildSlots(intake: Intake, catalog: CompanyCatalog, deadline: YMD) {
  const remedy = REMEDY_TEXT[intake.desiredRemedy];
  const platformName = appLabel(intake, catalog);
  const companyName = recipientLabel(intake, catalog);
  const alreadyDidEn = intake.alreadyDid
    ? `Already tried: ${intake.alreadyDid}. No resolution.`
    : "";
  const alreadyDidHi = intake.alreadyDid
    ? `पहले किया गया प्रयास: ${intake.alreadyDid}। अभी तक समाधान नहीं हुआ।`
    : "";
  const utrLineEn = intake.utr
    ? ` (UTR: ${intake.utr})`
    : " (UTR not available — please locate using amount, date and time)";
  const utrLineHi = intake.utr
    ? ` (UTR: ${intake.utr})`
    : " (UTR उपलब्ध नहीं — कृपया राशि, तिथि और समय के आधार पर खोजें)";
  const paidOnYMD = ymdFromISODate(intake.paidOn);
  const deliveredOnYMD = intake.deliveredOn ? ymdFromISODate(intake.deliveredOn) : null;
  const listedPriceInrFormatted =
    intake.listedPriceInr !== undefined ? formatInrNumber(intake.listedPriceInr) : "";
  const priceDifferenceFormatted =
    intake.listedPriceInr !== undefined
      ? formatInrNumber(intake.amountInr - intake.listedPriceInr)
      : "";

  return {
    en: {
      orderId: intake.orderId ?? "[ORDER ID NOT PROVIDED — attach screenshot]",
      platformName,
      companyName,
      amountInr: formatInrNumber(intake.amountInr),
      listedPriceInr: listedPriceInrFormatted,
      priceDifference: priceDifferenceFormatted,
      paidOnFormatted: formatYMDEn(paidOnYMD),
      deliveredOnFormatted: deliveredOnYMD
        ? formatYMDEn(deliveredOnYMD)
        : "[DELIVERY DATE NOT PROVIDED]",
      whatHappened: intake.whatHappened,
      alreadyDidLine: alreadyDidEn,
      remedyText: remedy.en,
      deadlineFormatted: formatYMDEn(deadline),
      utrLine: utrLineEn,
      userDisplayName: intake.userDisplayName ?? "[Your name]",
      city: intake.city ?? "",
    },
    hi: {
      orderId: intake.orderId ?? "[ऑर्डर आईडी उपलब्ध नहीं — स्क्रीनशॉट संलग्न करें]",
      platformName,
      companyName,
      amountInr: formatInrNumber(intake.amountInr),
      listedPriceInr: listedPriceInrFormatted,
      priceDifference: priceDifferenceFormatted,
      paidOnFormatted: formatYMDHi(paidOnYMD),
      deliveredOnFormatted: deliveredOnYMD
        ? formatYMDHi(deliveredOnYMD)
        : "[डिलीवरी तिथि उपलब्ध नहीं]",
      whatHappened: intake.whatHappened,
      alreadyDidLine: alreadyDidHi,
      remedyText: remedy.hi,
      deadlineFormatted: formatYMDHi(deadline),
      utrLine: utrLineHi,
      userDisplayName: intake.userDisplayName ?? "[आपका नाम]",
      city: intake.city ?? "",
    },
  };
}

function nchFields(intake: Intake, catalog: CompanyCatalog, deadline: YMD): Record<string, string> {
  return {
    "Company / Platform Name": recipientLabel(intake, catalog),
    "Order / Transaction ID": intake.orderId ?? "Not available",
    "Amount (INR)": formatInr(intake.amountInr),
    "Date of Purchase / Payment": formatYMDEn(ymdFromISODate(intake.paidOn)),
    "Nature of Complaint": intake.whatHappened,
    "Remedy Sought": REMEDY_TEXT[intake.desiredRemedy].en,
    "Response Deadline Given to Company": formatYMDEn(deadline),
  };
}

function bankFields(intake: Intake, deadline: YMD): Record<string, string> | undefined {
  if (intake.category !== "upi") return undefined;
  return {
    "UTR / Transaction Reference": intake.utr ?? "Not available — locate via amount/date/time",
    "Amount (INR)": formatInr(intake.amountInr),
    "Date of Transaction": formatYMDEn(ymdFromISODate(intake.paidOn)),
    "Remitting App": intake.platform,
    Issue: intake.whatHappened,
    "Deadline Given to Bank": formatYMDEn(deadline),
  };
}

function nextSteps(intake: Intake): { en: string[]; hi: string[] } {
  if (intake.category === "upi") {
    return {
      en: [
        "Contact your bank's grievance/nodal officer with the UTR and this packet.",
        "If unresolved after the deadline, file on the RBI Complaint Management System (CMS).",
        "Escalate to the RBI Banking Ombudsman if the bank does not respond within 30 days.",
      ],
      hi: [
        "UTR और यह पैकेट लेकर अपने बैंक के शिकायत/नोडल अधिकारी से संपर्क करें।",
        "यदि डेडलाइन के बाद भी समाधान नहीं होता, तो RBI शिकायत प्रबंधन प्रणाली (CMS) पर शिकायत दर्ज करें।",
        "यदि बैंक 30 दिनों में जवाब नहीं देता, तो RBI बैंकिंग लोकपाल तक शिकायत बढ़ाएं।",
      ],
    };
  }
  return {
    en: [
      "Send this message/email to the platform's official grievance channel.",
      "If unresolved after the deadline, file a complaint on the National Consumer Helpline (1915) or consumerhelpline.gov.in.",
      "If still unresolved, file a case on e-Daakhil under the Consumer Protection Act, 2019.",
    ],
    hi: [
      "यह संदेश/ईमेल प्लेटफ़ॉर्म के आधिकारिक शिकायत चैनल पर भेजें।",
      "यदि डेडलाइन के बाद भी समाधान नहीं होता, तो नेशनल कंज्यूमर हेल्पलाइन (1915) या consumerhelpline.gov.in पर शिकायत दर्ज करें।",
      "यदि फिर भी समाधान नहीं होता, तो उपभोक्ता संरक्षण अधिनियम, 2019 के तहत e-Daakhil पर मामला दर्ज करें।",
    ],
  };
}

export function generatePacket(intake: Intake, catalog: CompanyCatalog, now: Date = new Date()): Packet {
  const deadline = computeDeadlineYMD(intake.deadlineDays, now);
  const slots = buildSlots(intake, catalog, deadline);
  const en = loadTemplateFile(intake.templateId, "en");
  const hi = loadTemplateFile(intake.templateId, "hi");
  const { utr: _utr, ...intakeWithoutUtr } = intake;

  return {
    id: ulid(),
    createdAt: now.toISOString(),
    intake: intakeWithoutUtr,
    artifacts: {
      whatsapp: {
        en: fillWhatsappWithinBudget(en.whatsapp, slots.en),
        hi: fillWhatsappWithinBudget(hi.whatsapp, slots.hi),
      },
      emailSubject: {
        en: fillSlots(en.email_subject, slots.en),
        hi: fillSlots(hi.email_subject, slots.hi),
      },
      emailBody: {
        en: fillSlots(en.email_body, slots.en),
        hi: fillSlots(hi.email_body, slots.hi),
      },
      nchFields: nchFields(intake, catalog, deadline),
      bankFields: bankFields(intake, deadline),
      portalLinks: intake.category === "upi" ? PORTAL_LINKS_UPI : PORTAL_LINKS_ECOM,
      nextSteps: nextSteps(intake),
    },
  };
}
