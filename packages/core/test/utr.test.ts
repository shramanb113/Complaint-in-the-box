import { describe, it, expect } from "vitest";
import { generatePacket } from "../src/generatePacket";
import { loadCompanyCatalog } from "../src/companies";
import { UTR_TOKEN, UTR_BANK_MISSING, applyUtr, normalizeUtr } from "../src/utr";
import type { Intake } from "../src/types";

const NOW = new Date("2026-09-15T12:00:00Z");
const catalog = loadCompanyCatalog();

const upiIntake: Intake = {
  category: "upi",
  templateId: "upi_double_debit",
  locale: "both",
  platform: "gpay",
  companyName: "Sharma Electricians",
  amountInr: 1200,
  paidOn: "2026-09-13",
  whatHappened: "The same ₹1,200 was debited twice within one minute for a single payment.",
  desiredRemedy: "reverse_failed_upi",
  deadlineDays: 2,
  utr: UTR_TOKEN,
};

const ecomIntake: Intake = {
  category: "ecommerce",
  templateId: "ecom_wrong_item",
  locale: "both",
  platform: "flipkart",
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "Wrong mixer delivered, cracked blade on arrival.",
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

describe("normalizeUtr", () => {
  it("accepts a 12-digit UTR and strips spaces", () => {
    expect(normalizeUtr("409912345678")).toBe("409912345678");
    expect(normalizeUtr(" 4099 1234 5678 ")).toBe("409912345678");
  });
  it("accepts alphanumeric references of 8-35 characters", () => {
    expect(normalizeUtr("AXIS1234567890")).toBe("AXIS1234567890");
  });
  it("rejects too short, too long, or non-alphanumeric input", () => {
    expect(normalizeUtr("1234567")).toBeUndefined();
    expect(normalizeUtr("A".repeat(36))).toBeUndefined();
    expect(normalizeUtr("4099-1234-5678")).toBeUndefined();
    expect(normalizeUtr("")).toBeUndefined();
  });
});

describe("generatePacket with UTR_TOKEN", () => {
  it("embeds the token in WhatsApp, email and bank fields, and never stores a utr on the intake", () => {
    const packet = generatePacket(upiIntake, catalog, NOW);
    expect(packet.artifacts.whatsapp.en).toContain(`(UTR: ${UTR_TOKEN})`);
    expect(packet.artifacts.whatsapp.hi).toContain(`(UTR: ${UTR_TOKEN})`);
    expect(packet.artifacts.emailBody.en).toContain(UTR_TOKEN);
    expect(packet.artifacts.bankFields?.["UTR / Transaction Reference"]).toBe(UTR_TOKEN);
    expect(packet.intake).not.toHaveProperty("utr");
  });
});

describe("applyUtr", () => {
  const packet = generatePacket(upiIntake, catalog, NOW);

  it("replaces the token everywhere with a valid UTR", () => {
    const result = applyUtr(packet, "4099 1234 5678");
    expect(result.artifacts.whatsapp.en).toContain("(UTR: 409912345678)");
    expect(result.artifacts.whatsapp.hi).toContain("(UTR: 409912345678)");
    expect(result.artifacts.bankFields?.["UTR / Transaction Reference"]).toBe("409912345678");
    expect(JSON.stringify(result.artifacts)).not.toContain(UTR_TOKEN);
  });

  it("falls back to the 'not available' wording when no UTR is entered", () => {
    const result = applyUtr(packet, undefined);
    expect(result.artifacts.whatsapp.en).toContain("UTR not available");
    expect(result.artifacts.whatsapp.hi).toContain("UTR उपलब्ध नहीं");
    expect(result.artifacts.bankFields?.["UTR / Transaction Reference"]).toBe(UTR_BANK_MISSING);
    expect(JSON.stringify(result.artifacts)).not.toContain(UTR_TOKEN);
  });

  it("treats an invalid UTR the same as no UTR", () => {
    const result = applyUtr(packet, "12");
    expect(result.artifacts.whatsapp.en).toContain("UTR not available");
    expect(JSON.stringify(result.artifacts)).not.toContain(UTR_TOKEN);
  });

  it("does not mutate the packet it was given", () => {
    applyUtr(packet, "409912345678");
    expect(packet.artifacts.whatsapp.en).toContain(UTR_TOKEN);
  });

  it("leaves a packet without any token unchanged (e.g. an ecommerce packet)", () => {
    const ecom = generatePacket(ecomIntake, catalog, NOW);
    expect(applyUtr(ecom, "409912345678").artifacts).toEqual(ecom.artifacts);
  });
});

describe("applyUtr never leaves a bare token in the finished letter", () => {
  const embedded: Intake = { ...upiIntake, whatHappened: "Ref [[UTR]] shown in my app statement" };
  const packet = generatePacket(embedded, catalog, NOW);

  it("starts with the token typed into the narrative reaching every artifact (guards against a vacuous test)", () => {
    expect(packet.artifacts.whatsapp.en).toContain("Ref [[UTR]] shown");
    expect(packet.artifacts.whatsapp.hi).toContain("Ref [[UTR]] shown");
    expect(packet.artifacts.emailBody.en).toContain("Ref [[UTR]] shown");
    expect(packet.artifacts.bankFields?.Issue).toContain(UTR_TOKEN);
    expect(packet.artifacts.nchFields["Nature of Complaint"]).toContain(UTR_TOKEN);
  });

  it("removes it from every output field when no UTR is entered", () => {
    const { artifacts } = applyUtr(packet, undefined);
    expect(JSON.stringify(artifacts)).not.toContain(UTR_TOKEN);
    expect(artifacts.nchFields["Nature of Complaint"]).toBe("Ref  shown in my app statement");
  });

  it("swaps it for the UTR in every output field, including embedded portal and bank values", () => {
    const { artifacts } = applyUtr(packet, "409912345678");
    expect(JSON.stringify(artifacts)).not.toContain(UTR_TOKEN);
    expect(artifacts.nchFields["Nature of Complaint"]).toBe("Ref 409912345678 shown in my app statement");
    expect(artifacts.bankFields?.Issue).toBe("Ref 409912345678 shown in my app statement");
  });

  it.each([undefined, "409912345678"])("leaves no token anywhere for a normal UPI packet (input=%s)", (input) => {
    const { artifacts } = applyUtr(generatePacket(upiIntake, catalog, NOW), input);
    expect(JSON.stringify(artifacts)).not.toContain(UTR_TOKEN);
  });
});
