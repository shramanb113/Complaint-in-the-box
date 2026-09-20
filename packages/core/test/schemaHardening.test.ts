import { describe, it, expect } from "vitest";
import { createIntakeSchema, MAX_AMOUNT_INR, MIN_ISO_DATE, SCHEMA_ISSUES } from "../src/schema";
import { UTR_TOKEN } from "../src/utr";

const NOW = new Date("2026-09-20T06:00:00Z");
const schema = createIntakeSchema(NOW);

const base = {
  category: "ecommerce" as const,
  templateId: "ecom_wrong_item" as const,
  locale: "both" as const,
  platform: "flipkart" as const,
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "Wrong mixer delivered, cracked blade on arrival.",
  desiredRemedy: "pickup_and_refund" as const,
  deadlineDays: 7 as const,
};

const messagesFor = (input: unknown, field: string): string[] => {
  const result = schema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
};

describe("the reserved UTR marker", () => {
  const cases: [string, string][] = [
    ["companyName", "Shop " + UTR_TOKEN],
    ["orderId", UTR_TOKEN],
    ["city", "Pune " + UTR_TOKEN],
    ["state", UTR_TOKEN],
    ["whatHappened", "The item never arrived " + UTR_TOKEN],
    ["alreadyDid", "Called support " + UTR_TOKEN],
    ["userDisplayName", UTR_TOKEN],
  ];

  it.each(cases)("is rejected in %s", (field, value) => {
    expect(messagesFor({ ...base, [field]: value }, field)).toContain(SCHEMA_ISSUES.reservedText);
  });

  it("is still accepted in the utr field itself, which is where the server puts it", () => {
    expect(schema.safeParse({ ...base, category: "upi", templateId: "upi_double_debit", platform: "gpay", companyName: "Shop", utr: UTR_TOKEN, desiredRemedy: "reverse_failed_upi" }).success).toBe(true);
  });

  it("does not affect ordinary text that only looks similar", () => {
    expect(schema.safeParse({ ...base, whatHappened: "Paid using [UTR] and [[ref]] both failed to show." }).success).toBe(true);
  });
});

describe("the amount ceiling", () => {
  it("accepts the maximum and rejects one more", () => {
    expect(schema.safeParse({ ...base, amountInr: MAX_AMOUNT_INR }).success).toBe(true);
    expect(schema.safeParse({ ...base, amountInr: MAX_AMOUNT_INR + 1 }).success).toBe(false);
  });

  it("applies to the listed price too", () => {
    const fee = { ...base, category: "hidden_fee" as const, templateId: "fee_drip_pricing" as const, desiredRemedy: "remove_hidden_fee" as const, amountInr: MAX_AMOUNT_INR };
    expect(schema.safeParse({ ...fee, listedPriceInr: MAX_AMOUNT_INR - 1 }).success).toBe(true);
    expect(messagesFor({ ...fee, listedPriceInr: MAX_AMOUNT_INR + 1 }, "listedPriceInr").length).toBeGreaterThan(0);
  });
});

describe("the date floor", () => {
  it("accepts the floor date and rejects the day before, for every date field", () => {
    expect(schema.safeParse({ ...base, paidOn: MIN_ISO_DATE, deliveredOn: MIN_ISO_DATE }).success).toBe(true);
    expect(messagesFor({ ...base, paidOn: "2015-12-31" }, "paidOn")).toContain(SCHEMA_ISSUES.tooOldDate);
    expect(messagesFor({ ...base, deliveredOn: "2015-12-31" }, "deliveredOn")).toContain(SCHEMA_ISSUES.tooOldDate);
  });

  it("still reports a future date with its own message", () => {
    expect(messagesFor({ ...base, paidOn: "2026-09-25" }, "paidOn")).toContain(SCHEMA_ISSUES.futureDate);
  });
});

describe("SCHEMA_ISSUES", () => {
  it("matches the messages the schema really emits, so the form can map them", () => {
    expect(messagesFor({ ...base, platform: "other" }, "companyName")).toContain(SCHEMA_ISSUES.companyRequired);
    expect(
      messagesFor({ ...base, category: "hidden_fee", templateId: "fee_drip_pricing", desiredRemedy: "remove_hidden_fee" }, "listedPriceInr")
    ).toContain(SCHEMA_ISSUES.listedPrice);
    expect(messagesFor({ ...base, templateId: "upi_double_debit" }, "templateId")).toContain(SCHEMA_ISSUES.templateCategory);
  });
});
