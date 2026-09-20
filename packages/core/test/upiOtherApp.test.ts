import { describe, it, expect } from "vitest";
import { generatePacket } from "../src/generatePacket";
import { loadCompanyCatalog } from "../src/companies";
import { UTR_TOKEN } from "../src/utr";
import type { Intake } from "../src/types";

const NOW = new Date("2026-09-15T12:00:00Z");
const catalog = loadCompanyCatalog();

const upi: Intake = {
  category: "upi",
  templateId: "upi_double_debit",
  locale: "both",
  platform: "other",
  companyName: "Sharma Electricians",
  amountInr: 1200,
  paidOn: "2026-09-13",
  utr: UTR_TOKEN,
  whatHappened: "The money was taken twice from my account for one payment.",
  desiredRemedy: "reverse_failed_upi",
  deadlineDays: 7,
};

describe("UPI payment from an app we do not list", () => {
  it("says 'my UPI app' instead of the word 'other'", () => {
    const { whatsapp } = generatePacket(upi, catalog, NOW).artifacts;
    expect(whatsapp.en).toContain("my UPI app");
    expect(whatsapp.en).not.toMatch(/\bvia other\b/i);
    expect(whatsapp.hi).toContain("मेरे UPI ऐप");
    expect(whatsapp.en).toContain("Sharma Electricians");
  });

  it("names the app in the bank-portal field", () => {
    const fields = generatePacket(upi, catalog, NOW).artifacts.bankFields;
    expect(fields?.["Remitting App"]).toBe("Other UPI app");
  });

  it("leaves a known app exactly as before", () => {
    const { whatsapp } = generatePacket({ ...upi, platform: "gpay" }, catalog, NOW).artifacts;
    expect(whatsapp.en).toContain("Google Pay");
    expect(whatsapp.en).not.toContain("my UPI app");
  });
});
