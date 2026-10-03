import { z } from "zod";
import { formatYMDEn, nowToIstYMD, ymdFromISODate, ymdToIsoDate } from "./dates";
import { formatInr } from "./money";
import { MAX_AMOUNT_INR } from "./schema";
import type { CompanyCatalog, Intake } from "./types";

/**
 * Facts needed to file with NCH or a Consumer Commission. Deliberately NOT part
 * of Intake: the complainant block is personal data and must stay on the device,
 * so the server never receives or stores this type.
 */
export const EVIDENCE_KEYS = ["order_confirmation", "payment_proof", "photos_video", "chat_email_trail"] as const;
export type EvidenceKey = (typeof EVIDENCE_KEYS)[number];

export const EVIDENCE_TITLE: Record<EvidenceKey, string> = {
  order_confirmation: "Order confirmation",
  payment_proof: "Proof of payment",
  photos_video: "Photographs or video",
  chat_email_trail: "Chat or email trail with the company",
};

export const FilingFactsSchema = z.object({
  amountClaimed: z.number().int().positive().max(MAX_AMOUNT_INR),
  compensationClaimedInr: z.number().int().nonnegative().max(MAX_AMOUNT_INR).optional(),
  issueOn: z.string(),
  firstComplaintOn: z.string().optional(),
  lastReplyOn: z.string().optional(),
  companyTicketRef: z.string().trim().max(60).optional(),
  companyReplyReason: z.string().trim().max(200).optional(),
  contactChannel: z.string().trim().max(40).optional(),
  evidenceHave: z.array(z.enum(EVIDENCE_KEYS)),
  complainant: z.object({
    fullName: z.string(),
    addressLine: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    mobile: z.string(),
    email: z.string(),
    addressType: z.enum(["present", "permanent", "business"]),
  }),
  opposite: z.object({
    legalName: z.string(),
    registeredOffice: z.string(),
  }),
});
export type FilingFacts = z.infer<typeof FilingFactsSchema>;

export type Forum = "district" | "state" | "national";

/** Pecuniary limits by consideration paid. Secondary-sourced; see spec section 2. */
export function suggestForum(amountPaidInr: number): Forum {
  if (amountPaidInr <= 5_000_000) return "district";
  if (amountPaidInr <= 20_000_000) return "state";
  return "national";
}

export const FORUM_NAME: Record<Forum, string> = {
  district: "District Consumer Disputes Redressal Commission",
  state: "State Consumer Disputes Redressal Commission",
  national: "National Consumer Disputes Redressal Commission",
};

export type ReadinessCode =
  | "missing_field"
  | "date_order"
  | "claim_exceeds_paid"
  | "nearing_limitation"
  | "past_limitation"
  | "not_approached"
  | "no_evidence"
  | "other_forum";

export const READINESS_MESSAGES: Record<ReadinessCode, { en: string; hi: string }> = {
  missing_field: {
    en: "This detail is needed to file. Fill it in.",
    hi: "फ़ाइल करने के लिए यह जानकारी ज़रूरी है। इसे भरें।",
  },
  date_order: {
    en: "These dates are out of order. They must run: payment, problem, first complaint, company's last reply, today.",
    hi: "ये तारीखें क्रम में नहीं हैं। क्रम होना चाहिए: भुगतान, समस्या, पहली शिकायत, कंपनी का आख़िरी जवाब, आज।",
  },
  claim_exceeds_paid: {
    en: "The refund you claim cannot be more than you paid. Put any extra under compensation.",
    hi: "आपका रिफ़ंड दावा चुकाई गई राशि से ज़्यादा नहीं हो सकता। अतिरिक्त राशि मुआवज़े में लिखें।",
  },
  nearing_limitation: {
    en: "The problem is over 18 months old. Consumer cases generally must be filed within two years, so file soon.",
    hi: "समस्या 18 महीने से पुरानी है। उपभोक्ता मामले आमतौर पर दो साल के भीतर दर्ज करने होते हैं, इसलिए जल्दी दर्ज करें।",
  },
  past_limitation: {
    en: "The problem is over two years old. A Commission may refuse it as out of time unless you give a reason for the delay.",
    hi: "समस्या दो साल से पुरानी है। देरी का कारण न बताने पर आयोग इसे समय-सीमा से बाहर मान सकता है।",
  },
  not_approached: {
    en: "You have not recorded a first complaint to the company. NCH and Commissions expect you to have tried the company first.",
    hi: "कंपनी को पहली शिकायत की तारीख़ दर्ज नहीं है। NCH और आयोग उम्मीद करते हैं कि आपने पहले कंपनी से संपर्क किया हो।",
  },
  no_evidence: {
    en: "You have ticked no evidence. A complaint with no documents is easy to reject.",
    hi: "आपने कोई सबूत नहीं चुना। बिना दस्तावेज़ की शिकायत आसानी से ख़ारिज हो सकती है।",
  },
  other_forum: {
    en: "Above ₹50 lakh the case goes to a State or National Commission, not the District one. Check the suggested commission.",
    hi: "₹50 लाख से ऊपर मामला ज़िला नहीं, राज्य या राष्ट्रीय आयोग में जाता है। सुझाया गया आयोग देखें।",
  },
};

export interface ReadinessIssue {
  code: ReadinessCode;
  field?: string;
}

export interface Readiness {
  ready: boolean;
  blockers: ReadinessIssue[];
  warnings: ReadinessIssue[];
}

const blank = (v: string | undefined) => !v || v.trim() === "";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function shiftMonths(iso: string, months: number): string {
  const { y, m, d } = ymdFromISODate(iso);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const dim = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return ymdToIsoDate({ y: ny, m: nm, d: Math.min(d, dim) });
}

export function checkFilingReadiness(intake: Intake, facts: FilingFacts, now: Date = new Date()): Readiness {
  const blockers: ReadinessIssue[] = [];
  const warnings: ReadinessIssue[] = [];
  const missing = (field: string) => blockers.push({ code: "missing_field", field });
  const c = facts.complainant;

  if (blank(c.fullName)) missing("complainant.fullName");
  if (blank(c.addressLine)) missing("complainant.addressLine");
  if (blank(c.city)) missing("complainant.city");
  if (blank(c.state)) missing("complainant.state");
  if (!/^\d{6}$/.test(c.pincode.trim())) missing("complainant.pincode");
  if (!/^[6-9]\d{9}$/.test(c.mobile.trim())) missing("complainant.mobile");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim())) missing("complainant.email");
  if (blank(facts.opposite.legalName)) missing("opposite.legalName");
  if (blank(facts.opposite.registeredOffice)) missing("opposite.registeredOffice");
  if (!ISO.test(facts.issueOn)) missing("issueOn");

  if (facts.amountClaimed > intake.amountInr) blockers.push({ code: "claim_exceeds_paid", field: "amountClaimed" });

  const today = ymdToIsoDate(nowToIstYMD(now));
  const chain: [string, string | undefined][] = [
    ["paidOn", intake.paidOn],
    ["issueOn", ISO.test(facts.issueOn) ? facts.issueOn : undefined],
    ["firstComplaintOn", facts.firstComplaintOn],
    ["lastReplyOn", facts.lastReplyOn],
    ["today", today],
  ];
  const present = chain.filter((x): x is [string, string] => !!x[1]);
  for (let i = 1; i < present.length; i++) {
    if (present[i][1] < present[i - 1][1]) {
      blockers.push({ code: "date_order", field: present[i][0] === "today" ? present[i - 1][0] : present[i][0] });
      break;
    }
  }

  if (ISO.test(facts.issueOn)) {
    if (facts.issueOn < shiftMonths(today, -24)) warnings.push({ code: "past_limitation", field: "issueOn" });
    else if (facts.issueOn < shiftMonths(today, -18)) warnings.push({ code: "nearing_limitation", field: "issueOn" });
  }
  if (!facts.firstComplaintOn) warnings.push({ code: "not_approached", field: "firstComplaintOn" });
  if (facts.evidenceHave.length === 0) warnings.push({ code: "no_evidence", field: "evidenceHave" });
  if (suggestForum(intake.amountInr) !== "district") warnings.push({ code: "other_forum" });

  return { ready: blockers.length === 0, blockers, warnings };
}

export interface Row {
  label: string;
  value: string;
}

const fmt = (iso: string) => formatYMDEn(ymdFromISODate(iso));

function companyLegalName(intake: Intake, facts: FilingFacts, catalog: CompanyCatalog): string {
  return facts.opposite.legalName.trim() || catalog[intake.platform]?.legalName || intake.companyName || intake.platform;
}

/** The dated history, one line per event, used by NCH, the Synopsis and the Complaint. */
function events(intake: Intake, facts: FilingFacts): Row[] {
  const out: Row[] = [
    { label: intake.paidOn, value: `Paid ${formatInr(intake.amountInr)}${intake.orderId ? ` for order ${intake.orderId}` : ""}.` },
  ];
  if (intake.deliveredOn) out.push({ label: intake.deliveredOn, value: "Order delivered." });
  out.push({ label: facts.issueOn, value: intake.whatHappened });
  if (facts.firstComplaintOn) {
    const via = facts.contactChannel ? ` through ${facts.contactChannel}` : "";
    const ref = facts.companyTicketRef ? ` (ticket ${facts.companyTicketRef})` : "";
    out.push({ label: facts.firstComplaintOn, value: `Complained to the company${via}${ref}.` });
  }
  if (facts.lastReplyOn) {
    const why = facts.companyReplyReason ? `: ${facts.companyReplyReason}` : "";
    out.push({ label: facts.lastReplyOn, value: `Company's last reply${why}. The issue was not resolved.` });
  }
  return out.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
}

const eventLines = (intake: Intake, facts: FilingFacts) =>
  events(intake, facts).map((e) => `${fmt(e.label)}: ${e.value}`);

function reliefText(facts: FilingFacts): string {
  const comp = facts.compensationClaimedInr ? ` and compensation of ${formatInr(facts.compensationClaimedInr)}` : "";
  return `refund of ${formatInr(facts.amountClaimed)}${comp}`;
}

/** NCH grievance block. Order follows the INGRAM form as documented; confirm against the live form before ship. */
export function buildNchBlock(intake: Intake, facts: FilingFacts, catalog: CompanyCatalog): Row[] {
  const reply = facts.lastReplyOn
    ? ` Last reply ${fmt(facts.lastReplyOn)}${facts.companyReplyReason ? `: ${facts.companyReplyReason}` : ""}.`
    : "";
  const prior = facts.firstComplaintOn
    ? `Raised on ${fmt(facts.firstComplaintOn)}${facts.contactChannel ? ` via ${facts.contactChannel}` : ""}${
        facts.companyTicketRef ? `, reference ${facts.companyTicketRef}` : ""
      }.${reply}`
    : "Not yet raised with the company.";
  return [
    { label: "Company", value: companyLegalName(intake, facts, catalog) },
    { label: "Purchase city", value: facts.complainant.city.trim() },
    { label: "Product or service value", value: formatInr(intake.amountInr) },
    { label: "Prior complaint to the company", value: prior },
    {
      label: "Complaint description",
      value: `${eventLines(intake, facts).join(" ")} I request ${reliefText(facts)}.`,
    },
    {
      label: "Documents to attach",
      value: facts.evidenceHave.length ? facts.evidenceHave.map((k) => EVIDENCE_TITLE[k]).join("; ") : "None",
    },
  ];
}

export interface KitDocument {
  title: string;
  body: string;
  note?: string;
}

export interface FilingKit {
  forum: Forum;
  caseDetails: Row[];
  documents: KitDocument[];
  annexures: { title: string }[];
  portalSteps: string[];
}

const CATEGORY_LABEL: Record<Intake["category"], string> = {
  ecommerce: "E-commerce",
  upi: "Banking and digital payments",
  food: "Food delivery (e-commerce)",
  hidden_fee: "E-commerce: unfair trade practice (hidden charges)",
};

export function buildFilingKit(
  intake: Intake,
  facts: FilingFacts,
  catalog: CompanyCatalog,
  now: Date = new Date(),
): FilingKit {
  const forum = suggestForum(intake.amountInr);
  const c = facts.complainant;
  const opp = companyLegalName(intake, facts, catalog);
  const oppAddr = facts.opposite.registeredOffice.trim();
  const complainantBlock = `${c.fullName.trim()}, ${c.addressLine.trim()}, ${c.city.trim()}, ${c.state.trim()} ${c.pincode.trim()}. Mobile ${c.mobile.trim()}. Email ${c.email.trim()}.`;
  const lines = eventLines(intake, facts);
  const relief = reliefText(facts);
  const filedOn = formatYMDEn(nowToIstYMD(now));
  const annexures = facts.evidenceHave.map((k, i) => ({
    title: `Annexure ${String.fromCharCode(65 + i)}: ${EVIDENCE_TITLE[k]}`,
  }));

  const complaint = [
    `Before the ${FORUM_NAME[forum]}`,
    `Complainant: ${complainantBlock}`,
    `Opposite Party: ${opp}, ${oppAddr}.`,
    `Complaint under the Consumer Protection Act, 2019.`,
    `Facts:`,
    ...lines.map((l, i) => `${i + 1}. ${l}`),
    `The Opposite Party's conduct is a deficiency in service and, where it applies, an unfair trade practice.`,
    `Cause of action arose on ${fmt(facts.issueOn)}.`,
    `Prayer: the Complainant prays that the Opposite Party be directed to pay ${relief}, with interest from the date of payment and the cost of this complaint.`,
    annexures.length ? `Documents relied on: ${annexures.map((a) => a.title).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const documents: KitDocument[] = [
    {
      title: "Index",
      body: [
        "1. Proforma",
        "2. Synopsis with list of dates",
        "3. Memo of Parties",
        "4. Complaint",
        "5. Affidavit",
        ...annexures.map((a, i) => `${i + 6}. ${a.title}`),
      ].join("\n"),
    },
    {
      title: "Proforma",
      body: [
        `Complainant: ${complainantBlock}`,
        `Opposite Party: ${opp}, ${oppAddr}.`,
        `Amount paid: ${formatInr(intake.amountInr)}`,
        `Claim: ${relief}`,
        `Date of cause of action: ${fmt(facts.issueOn)}`,
      ].join("\n"),
    },
    {
      title: "Synopsis with list of dates",
      body: `The Complainant paid ${formatInr(intake.amountInr)} to ${opp} and was not given what was agreed. The Complainant complained and the matter was not resolved.\n\nList of dates and events:\n${lines.join("\n")}`,
    },
    {
      title: "Memo of Parties",
      body: `Complainant: ${complainantBlock}\n\nVersus\n\nOpposite Party: ${opp}, ${oppAddr}.`,
    },
    { title: "Complaint", body: complaint },
    {
      title: "Affidavit",
      body: `I, ${c.fullName.trim()}, of ${c.addressLine.trim()}, ${c.city.trim()}, do solemnly affirm and state that the facts in the accompanying complaint are true to my knowledge, that I have concealed nothing, and that the documents annexed are true copies of what I hold.\n\nDeponent: ${c.fullName.trim()}\nDate: ${filedOn}`,
      note: "Print this, sign it in front of a notary and get it notarised, then scan it. e-Jagriti needs the notarised copy.",
    },
  ];

  return {
    forum,
    caseDetails: [
      { label: "Amount paid", value: formatInr(intake.amountInr) },
      { label: "Claim amount", value: formatInr(facts.amountClaimed + (facts.compensationClaimedInr ?? 0)) },
      { label: "Date of cause of action", value: fmt(facts.issueOn) },
      { label: "State", value: c.state.trim() },
      { label: "District / city", value: c.city.trim() },
      { label: "Suggested commission", value: FORUM_NAME[forum] },
      { label: "Case category", value: CATEGORY_LABEL[intake.category] },
    ],
    documents,
    annexures,
    portalSteps: [
      'Open e-jagriti.gov.in, sign in, and choose "File New Case", then "Consumer Complaint".',
      "Review the document list and the fee for your claim amount.",
      "Case Details: copy each row from the case details above.",
      "Complainant: enter your details and pick the address type.",
      "Opposite Party: enter the company name and registered office from the Memo of Parties.",
      "Upload the Index, Proforma, Synopsis, Memo of Parties and the notarised Affidavit.",
      "Upload each annexure with the title shown in the annexure list.",
      "Pick the commission, tick the declaration and press Preview.",
      "Check every field on the Preview page and press Edit to fix anything.",
      "Final Submit is irreversible: the form cannot be edited afterwards. Save the reference number it shows.",
    ],
  };
}
