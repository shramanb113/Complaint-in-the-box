import { describe, it, expect } from "vitest";
import { generatePacket } from "../src/generatePacket";
import { loadCompanyCatalog } from "../src/companies";
import { createIntakeSchema, TemplateIdSchema } from "../src/schema";
import type { Intake, TemplateId } from "../src/types";

const catalog = loadCompanyCatalog();
const FIXED_NOW = new Date("2026-09-15T12:00:00Z"); // 2026-09-15 17:30 IST

// PRD §16 fixture
const ecomFixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_wrong_item",
  locale: "en",
  platform: "flipkart",
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "wrong mixer, cracked blade",
  alreadyDid: "raised in-app ticket",
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

describe("generatePacket - ecom_wrong_item", () => {
  it("includes all required facts in the English WhatsApp text, within 700 characters", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("OD123");
    expect(wa).toContain("₹2,499");
    expect(wa).toContain("10 Sep 2026");
    expect(wa).toContain("14 Sep 2026");
    expect(wa).toContain("wrong mixer, cracked blade");
    expect(wa).toContain("pickup of the wrong item and a full refund");
    expect(wa).toContain("22 Sep 2026"); // deadline = now (15 Sep) + 7 days, not paidOn + 7
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi).toContain("OD123");
    expect(packet.artifacts.whatsapp.hi).toContain("10 सितंबर 2026");
  });

  it("produces an email body between 180 and 350 words", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });

  it("strips utr from the stored intake even if it was never set on this template", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.intake).not.toHaveProperty("utr");
  });

  it("includes NCH portal links and nchFields for the ecommerce category", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.portalLinks.some((l) => l.label.includes("National Consumer Helpline") || l.label.includes("NCH"))).toBe(true);
    expect(packet.artifacts.nchFields["Order / Transaction ID"]).toBe("OD123");
    expect(packet.artifacts.bankFields).toBeUndefined();
  });

  it("falls back to an explicit placeholder when orderId is missing, never inventing one", () => {
    const { orderId, ...withoutOrderId } = ecomFixture;
    const packet = generatePacket(withoutOrderId as Intake, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("[ORDER ID NOT PROVIDED — attach screenshot]");
  });

  it("keeps the Hindi WhatsApp text within 700 characters", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("matches the known-good snapshot for all rendered artifacts", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.artifacts).toMatchSnapshot();
  });

  it("never leaves an unfilled {{slot}} marker anywhere, in either language", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    const allStrings = [
      packet.artifacts.whatsapp.en,
      packet.artifacts.whatsapp.hi,
      packet.artifacts.emailSubject.en,
      packet.artifacts.emailSubject.hi,
      packet.artifacts.emailBody.en,
      packet.artifacts.emailBody.hi,
      ...packet.artifacts.nextSteps.en,
      ...packet.artifacts.nextSteps.hi,
    ];
    for (const s of allStrings) {
      expect(s).not.toMatch(/\{\{/);
    }
  });

  it("keeps WhatsApp text (en and hi) within 700 chars and free of unfilled slots even with a whatHappened value near the schema's 400-char maximum", () => {
    const longWhatHappened = (
      "The item I received was completely different from what I ordered, and on top of that it arrived damaged with visible cracks and missing accessories that were listed as included in the original product description on the listing page, which I have screenshots of. " +
      "This is completely unacceptable and I have already wasted so much time trying to sort this out with support over chat and phone calls without any real resolution being offered to me at all so far unfortunately despite my repeated follow ups every single day."
    ).slice(0, 400);
    expect(longWhatHappened.length).toBe(400); // guard: the fixture must actually be near-max
    const packet = generatePacket(
      { ...ecomFixture, whatHappened: longWhatHappened },
      catalog,
      FIXED_NOW
    );
    expect(packet.artifacts.whatsapp.en.length).toBeLessThanOrEqual(700);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
    expect(packet.artifacts.whatsapp.en).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
  });
});

// PRD persona P2 fixture: Ramesh, UPI payment to a carpenter, GPay
const upiFixture: Intake = {
  category: "upi",
  templateId: "upi_debit_merchant_no_credit",
  locale: "en",
  platform: "gpay",
  companyName: "Ramesh's Carpenter",
  amountInr: 8000,
  paidOn: "2026-09-12",
  whatHappened: "Paid the carpenter via GPay but he says he has not received the money.",
  desiredRemedy: "reverse_failed_upi",
  deadlineDays: 2,
};

describe("generatePacket - upi_debit_merchant_no_credit", () => {
  it("includes a UTR placeholder when utr is missing", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("UTR not available");
  });

  it("includes the actual UTR when provided, and still strips it from stored intake", () => {
    const withUtr: Intake = { ...upiFixture, utr: "402812345678" };
    const packet = generatePacket(withUtr, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("402812345678");
    expect(packet.intake).not.toHaveProperty("utr");
  });

  it("separates the payment app (platformName) from the recipient (companyName)", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("via Google Pay");
    expect(packet.artifacts.whatsapp.en).toContain("to Ramesh's Carpenter");
  });

  it("mentions RBI/NPCI turnaround times without inventing a penalty amount", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.emailBody.en).toContain("RBI / NPCI turnaround times");
    expect(packet.artifacts.emailBody.en).not.toMatch(/penalty/i);
  });

  it("includes bankFields and RBI CMS / NPCI portal links for the UPI category", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.bankFields).toBeDefined();
    expect(packet.artifacts.bankFields?.["Amount (INR)"]).toBe("₹8,000");
    expect(packet.artifacts.portalLinks.some((l) => l.label.includes("RBI"))).toBe(true);
  });

  it("computes the 2-day deadline from now, in IST", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("17 Sep 2026");
  });

  it("produces an email body between 180 and 350 words", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });

  it("keeps the Hindi WhatsApp text within 700 characters", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("matches the known-good snapshot for all rendered artifacts, including the Hindi UTR-missing placeholder", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts).toMatchSnapshot();
  });

  it("never leaves an unfilled {{slot}} marker anywhere, in either language", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    const allStrings = [
      packet.artifacts.whatsapp.en,
      packet.artifacts.whatsapp.hi,
      packet.artifacts.emailSubject.en,
      packet.artifacts.emailSubject.hi,
      packet.artifacts.emailBody.en,
      packet.artifacts.emailBody.hi,
      ...packet.artifacts.nextSteps.en,
      ...packet.artifacts.nextSteps.hi,
    ];
    for (const s of allStrings) {
      expect(s).not.toMatch(/\{\{/);
    }
  });

  it("keeps WhatsApp text (en and hi) within 700 chars even with a whatHappened value near the schema's 400-char maximum", () => {
    const longWhatHappened = (
      "I paid the carpenter via GPay for furniture repair work he completed at my home, and the payment was debited from my bank account immediately, but he insists to this day that he never received any confirmation of the payment landing in his own account. " +
      "I have tried calling him multiple times and even visited his workshop in person to sort this out directly but he keeps saying the money never showed up on his side at all, which makes no sense given my bank statement clearly shows the debit."
    ).slice(0, 400);
    expect(longWhatHappened.length).toBe(400); // guard: the fixture must actually be near-max
    const packet = generatePacket(
      { ...upiFixture, whatHappened: longWhatHappened },
      catalog,
      FIXED_NOW
    );
    expect(packet.artifacts.whatsapp.en.length).toBeLessThanOrEqual(700);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
    expect(packet.artifacts.whatsapp.en).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
  });
});

const notDeliveredFixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_not_delivered",
  locale: "en",
  platform: "flipkart",
  orderId: "OD200",
  amountInr: 1499,
  paidOn: "2026-09-08",
  whatHappened: "Promised delivery date was 3 days ago and the item has still not arrived.",
  alreadyDid: "contacted support twice",
  desiredRemedy: "full_refund_original_mode",
  deadlineDays: 7,
};

describe("generatePacket - ecom_not_delivered", () => {
  it("includes all required facts and mentions non-delivery, in English", () => {
    const packet = generatePacket(notDeliveredFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("OD200");
    expect(wa).toContain("₹1,499");
    expect(wa).toContain("not been delivered");
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(notDeliveredFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(notDeliveredFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

const damagedFixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_damaged",
  locale: "en",
  platform: "flipkart",
  orderId: "OD300",
  amountInr: 3200,
  paidOn: "2026-09-05",
  deliveredOn: "2026-09-09",
  whatHappened: "Box was crushed in transit and the glass item inside arrived shattered.",
  desiredRemedy: "replacement",
  deadlineDays: 7,
};

describe("generatePacket - ecom_damaged", () => {
  it("mentions the condition on arrival and includes all required facts", () => {
    const packet = generatePacket(damagedFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("OD300");
    expect(wa).toContain("damaged");
    expect(wa).toContain("shattered");
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(damagedFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(damagedFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

const walletFixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_refund_to_wallet",
  locale: "en",
  platform: "flipkart",
  orderId: "OD400",
  amountInr: 999,
  paidOn: "2026-08-20",
  whatHappened: "Returned the item two weeks ago and the pickup was confirmed by the courier.",
  desiredRemedy: "full_refund_original_mode",
  deadlineDays: 7,
};

describe("generatePacket - ecom_refund_to_wallet", () => {
  it("demands refund to original payment mode, not wallet", () => {
    const packet = generatePacket(walletFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("OD400");
    expect(wa).toMatch(/original payment mode/);
    expect(wa).toMatch(/not wallet/);
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(walletFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(walletFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

const ghostedFixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_seller_ghosted",
  locale: "en",
  platform: "other",
  companyName: "Local Furniture Store",
  orderId: "OD500",
  amountInr: 5500,
  paidOn: "2026-08-25",
  whatHappened: "Seller stopped responding to my messages 10 days ago after the item never arrived.",
  desiredRemedy: "full_refund_original_mode",
  deadlineDays: 7,
};

describe("generatePacket - ecom_seller_ghosted", () => {
  it("mentions seller unresponsiveness and resolves platform='other' via companyName", () => {
    const packet = generatePacket(ghostedFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("OD500");
    expect(wa).toContain("Local Furniture Store");
    expect(wa).toContain("The seller has stopped responding to my messages");
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(ghostedFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(ghostedFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

const doubleDebitFixture: Intake = {
  category: "upi",
  templateId: "upi_double_debit",
  locale: "en",
  platform: "gpay",
  companyName: "Sharma Electricians",
  amountInr: 1200,
  paidOn: "2026-09-13",
  utr: "409912345678",
  whatHappened: "The same ₹1,200 was debited twice within one minute for a single payment.",
  desiredRemedy: "reverse_failed_upi",
  deadlineDays: 2,
};

describe("generatePacket - upi_double_debit", () => {
  it("asks the bank to reverse the duplicate transaction, with the UTR included", () => {
    const packet = generatePacket(doubleDebitFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("409912345678");
    expect(wa).toMatch(/duplicate/i);
    expect(wa).toContain("reverse the duplicate transaction");
    expect(wa).toContain("RBI / NPCI turnaround times");
    expect(wa).not.toMatch(/penalty/i);
    expect(wa).toContain("Sharma Electricians");
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("strips utr from the stored intake", () => {
    const packet = generatePacket(doubleDebitFixture, catalog, FIXED_NOW);
    expect(packet.intake).not.toHaveProperty("utr");
  });

  it("carries alreadyDid into both the English and Hindi email bodies", () => {
    const packet = generatePacket(
      { ...doubleDebitFixture, alreadyDid: "raised a ticket with my bank" },
      catalog,
      FIXED_NOW
    );
    expect(packet.artifacts.emailBody.en).toContain("raised a ticket with my bank");
    expect(packet.artifacts.emailBody.hi).toContain("raised a ticket with my bank");
  });

  it("includes bankFields for the UPI category", () => {
    const packet = generatePacket(doubleDebitFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.bankFields).toBeDefined();
  });

  it("renders the Hindi remedy as a grammatical noun phrase in the WhatsApp text", () => {
    const packet = generatePacket(doubleDebitFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).toContain(
      "मुझे डुप्लिकेट डेबिट के लिए राशि की मेरे खाते में वापसी (रिवर्सल) चाहिए"
    );
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(doubleDebitFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(doubleDebitFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

const missingItemFixture: Intake = {
  category: "food",
  templateId: "food_missing_item",
  locale: "en",
  platform: "swiggy",
  orderId: "SW100",
  amountInr: 650,
  paidOn: "2026-09-14",
  whatHappened: "2 of the 4 items I ordered were missing from the bag on delivery.",
  desiredRemedy: "full_refund_original_mode",
  deadlineDays: 7,
};

describe("generatePacket - food_missing_item", () => {
  it("mentions missing items and includes all required facts", () => {
    const packet = generatePacket(missingItemFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("SW100");
    expect(wa).toContain("were missing on delivery");
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("uses ecommerce-style portal links (NCH), not UPI links, for the food category", () => {
    const packet = generatePacket(missingItemFixture, catalog, FIXED_NOW);
    expect(
      packet.artifacts.portalLinks.some((l) => l.label.includes("National Consumer Helpline"))
    ).toBe(true);
    expect(packet.artifacts.bankFields).toBeUndefined();
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(missingItemFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(missingItemFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

const wrongFoodFixture: Intake = {
  category: "food",
  templateId: "food_wrong_item",
  locale: "en",
  platform: "zomato",
  orderId: "ZM200",
  amountInr: 450,
  paidOn: "2026-09-14",
  whatHappened: "Ordered paneer tikka but received chicken tikka instead, which I cannot eat.",
  desiredRemedy: "replacement",
  deadlineDays: 7,
};

describe("generatePacket - food_wrong_item", () => {
  it("mentions the mismatch between ordered and delivered items", () => {
    const packet = generatePacket(wrongFoodFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("ZM200");
    expect(wa).toMatch(/do not match|does not match/);
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(wrongFoodFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(wrongFoodFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

const dripPricingFixture: Intake = {
  category: "hidden_fee",
  templateId: "fee_drip_pricing",
  locale: "en",
  platform: "zepto",
  orderId: "ZP300",
  amountInr: 349,
  listedPriceInr: 299,
  paidOn: "2026-09-14",
  whatHappened: "Checkout added a ₹50 handling fee that was only visible on the final payment screen.",
  desiredRemedy: "remove_hidden_fee",
  deadlineDays: 7,
};

describe("generatePacket - fee_drip_pricing", () => {
  it("states the listed price, paid price, and the difference, without accusing a crime", () => {
    const packet = generatePacket(dripPricingFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("₹299");
    expect(wa).toContain("₹349");
    expect(wa).toContain("an additional ₹50 was revealed only at payment");
    expect(wa).toMatch(/revealed only at payment/);
    expect(packet.artifacts.emailSubject.en).toContain("refund of ₹50 requested by");
    expect(packet.artifacts.emailBody.en).not.toMatch(/crime|fraud|illegal/i);
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(dripPricingFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
    expect(packet.artifacts.whatsapp.hi).toContain("अतिरिक्त ₹50 केवल भुगतान के समय सामने आया");
    expect(packet.artifacts.whatsapp.hi).toContain("₹299");
    expect(packet.artifacts.whatsapp.hi).toContain("₹349");
  });

  it("renders the Hindi remedy as a grammatical noun phrase in the WhatsApp text", () => {
    const packet = generatePacket(dripPricingFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).toContain(
      "मुझे छुपे हुए शुल्क की वापसी और अतिरिक्त शुल्क की समाप्ति चाहिए"
    );
  });

  it("produces an email body within the 180-350 word range", () => {
    const packet = generatePacket(dripPricingFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(180);
    expect(wordCount).toBeLessThanOrEqual(350);
  });
});

describe("generatePacket - fee_drip_pricing input validation", () => {
  it("throws when listedPriceInr is missing", () => {
    const { listedPriceInr, ...withoutListedPrice } = dripPricingFixture;
    expect(() => generatePacket(withoutListedPrice as Intake, catalog, FIXED_NOW)).toThrow(
      "fee_drip_pricing requires listedPriceInr < amountInr"
    );
  });

  it("throws when listedPriceInr is not below amountInr", () => {
    expect(() =>
      generatePacket({ ...dripPricingFixture, listedPriceInr: 349 }, catalog, FIXED_NOW)
    ).toThrow("fee_drip_pricing requires listedPriceInr < amountInr");
    expect(() =>
      generatePacket({ ...dripPricingFixture, listedPriceInr: 400 }, catalog, FIXED_NOW)
    ).toThrow("fee_drip_pricing requires listedPriceInr < amountInr");
  });
});

describe("generatePacket - full catalog coverage sweep", () => {
  const allFixtures: Record<TemplateId, Intake> = {
    ecom_wrong_item: ecomFixture,
    ecom_not_delivered: notDeliveredFixture,
    ecom_damaged: damagedFixture,
    ecom_refund_to_wallet: walletFixture,
    ecom_seller_ghosted: ghostedFixture,
    upi_debit_merchant_no_credit: upiFixture,
    upi_double_debit: doubleDebitFixture,
    food_missing_item: missingItemFixture,
    food_wrong_item: wrongFoodFixture,
    fee_drip_pricing: dripPricingFixture,
  };

  it("covers all 10 TemplateId values", () => {
    const templateIds: TemplateId[] = [...TemplateIdSchema.options];
    expect(Object.keys(allFixtures).sort()).toEqual(templateIds.slice().sort());
  });

  it.each(Object.entries(allFixtures))(
    "%s: generates a complete packet with no unfilled slots in either language, WhatsApp within budget",
    (templateId, fixture) => {
      expect(fixture.templateId).toBe(templateId);
      expect(() => createIntakeSchema(FIXED_NOW).parse(fixture)).not.toThrow();
      const packet = generatePacket(fixture, catalog, FIXED_NOW);
      const allStrings = [
        packet.artifacts.whatsapp.en,
        packet.artifacts.whatsapp.hi,
        packet.artifacts.emailSubject.en,
        packet.artifacts.emailSubject.hi,
        packet.artifacts.emailBody.en,
        packet.artifacts.emailBody.hi,
        ...packet.artifacts.nextSteps.en,
        ...packet.artifacts.nextSteps.hi,
      ];
      for (const s of allStrings) {
        expect(s).not.toMatch(/\{\{/);
      }
      expect(packet.artifacts.whatsapp.en.length).toBeLessThanOrEqual(700);
      expect(packet.artifacts.whatsapp.hi.length).toBeLessThanOrEqual(700);
    }
  );
});
