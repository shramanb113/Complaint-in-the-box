import { describe, it, expect } from "vitest";
import { generatePacket } from "../src/generatePacket";
import { loadCompanyCatalog } from "../src/companies";
import type { Intake } from "../src/types";

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

  it("produces an email body between roughly 130 and 400 words", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(130);
    expect(wordCount).toBeLessThan(400);
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
});
