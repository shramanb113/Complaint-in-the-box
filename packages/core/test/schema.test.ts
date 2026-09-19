import { describe, it, expect } from "vitest";
import { z } from "zod";
import { IntakeSchema, TemplateIdSchema, createIntakeSchema } from "../src/schema";
import { TEMPLATE_CATEGORY } from "../src/templateCategory";
import type { Intake } from "../src/types";

const baseIntake = {
  category: "ecommerce" as const,
  templateId: "ecom_wrong_item" as const,
  locale: "en" as const,
  platform: "flipkart" as const,
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "Wrong mixer delivered, cracked blade on arrival.",
  desiredRemedy: "pickup_and_refund" as const,
  deadlineDays: 7 as const,
};

describe("IntakeSchema", () => {
  it("accepts a valid intake", () => {
    expect(() => IntakeSchema.parse(baseIntake)).not.toThrow();
  });

  it("rejects amountInr <= 0", () => {
    expect(() => IntakeSchema.parse({ ...baseIntake, amountInr: 0 })).toThrow();
  });

  it("rejects whatHappened shorter than 20 characters", () => {
    expect(() => IntakeSchema.parse({ ...baseIntake, whatHappened: "too short" })).toThrow();
  });

  it("rejects a future paidOn date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const isoFuture = future.toISOString().slice(0, 10);
    expect(() => IntakeSchema.parse({ ...baseIntake, paidOn: isoFuture })).toThrow();
  });

  it("requires companyName when platform is 'other'", () => {
    expect(() =>
      IntakeSchema.parse({ ...baseIntake, platform: "other", companyName: undefined })
    ).toThrow();
    expect(() =>
      IntakeSchema.parse({ ...baseIntake, platform: "other", companyName: "Local Kirana Store" })
    ).not.toThrow();
  });

  it("rejects a whitespace-only companyName, including for platform 'other'", () => {
    expect(() =>
      IntakeSchema.parse({ ...baseIntake, platform: "other", companyName: "   " })
    ).toThrow();
    expect(() => IntakeSchema.parse({ ...baseIntake, companyName: "   " })).toThrow();
  });

  it("accepts a padded companyName and stores it trimmed", () => {
    const parsed = IntakeSchema.parse({ ...baseIntake, platform: "other", companyName: "  Acme  " });
    expect(parsed.companyName).toBe("Acme");
  });

  it("rejects an unknown desiredRemedy value", () => {
    expect(() =>
      IntakeSchema.parse({ ...baseIntake, desiredRemedy: "give_me_everything" })
    ).toThrow();
  });

  it("accepts today's date in IST even when it is still 'tomorrow' in UTC (regression)", () => {
    // 2026-09-15T19:30:00Z = 2026-09-16T01:00 IST — the IST calendar date is
    // already the 16th, even though the UTC calendar date is still the 15th.
    const fixedNow = new Date("2026-09-15T19:30:00Z");
    const schema = createIntakeSchema(fixedNow);
    expect(() => schema.parse({ ...baseIntake, paidOn: "2026-09-16" })).not.toThrow();
  });

  it("still rejects a date that is in the future even in IST (regression sanity check)", () => {
    const fixedNow = new Date("2026-09-15T19:30:00Z"); // 2026-09-16 IST
    const schema = createIntakeSchema(fixedNow);
    expect(() => schema.parse({ ...baseIntake, paidOn: "2026-09-17" })).toThrow();
  });
});

describe("IntakeSchema - fee_drip_pricing", () => {
  const dripFixture = {
    ...baseIntake,
    category: "hidden_fee" as const,
    templateId: "fee_drip_pricing" as const,
    platform: "zepto" as const,
    desiredRemedy: "remove_hidden_fee" as const,
  };

  it("requires listedPriceInr for fee_drip_pricing", () => {
    expect(() => IntakeSchema.parse(dripFixture)).toThrow();
  });

  it("accepts fee_drip_pricing when listedPriceInr is present and less than amountInr", () => {
    expect(() =>
      IntakeSchema.parse({ ...dripFixture, listedPriceInr: 299, amountInr: 349 })
    ).not.toThrow();
  });

  it("rejects listedPriceInr >= amountInr for fee_drip_pricing", () => {
    expect(() =>
      IntakeSchema.parse({ ...dripFixture, listedPriceInr: 400, amountInr: 349 })
    ).toThrow();
  });

  it("does not require listedPriceInr for other templates", () => {
    expect(() => IntakeSchema.parse(baseIntake)).not.toThrow();
  });
});

describe("IntakeSchema type", () => {
  it("IntakeSchema's inferred output satisfies the Intake interface (compile-time check)", () => {
    // If IntakeSchema's inferred type ever diverges from Intake, this
    // assignment fails to compile under `tsc --noEmit` — that's the point.
    const _typeCheck: Intake = {} as z.infer<typeof IntakeSchema>;
    expect(_typeCheck).toBeDefined();
  });
});

describe("IntakeSchema - free-text bounds and category consistency", () => {
  it.each([
    ["companyName", 60],
    ["orderId", 30],
    ["city", 50],
    ["state", 50],
    ["alreadyDid", 200],
    ["userDisplayName", 50],
    ["utr", 35],
  ] as const)("accepts %s at %i characters and rejects one more", (field, max) => {
    const base = { ...baseIntake, platform: "other" as const, companyName: "Local Shop" };
    expect(() => IntakeSchema.parse({ ...base, [field]: "a".repeat(max) })).not.toThrow();
    expect(() => IntakeSchema.parse({ ...base, [field]: "a".repeat(max + 1) })).toThrow();
  });

  it("rejects a templateId that does not belong to the chosen category", () => {
    expect(() => IntakeSchema.parse({ ...baseIntake, category: "upi" as const })).toThrow();
    expect(() => IntakeSchema.parse({ ...baseIntake, category: "food" as const })).toThrow();
  });

  it("maps every template id to a category", () => {
    expect(Object.keys(TEMPLATE_CATEGORY).sort()).toEqual([...TemplateIdSchema.options].sort());
    expect(TEMPLATE_CATEGORY.fee_drip_pricing).toBe("hidden_fee");
    expect(TEMPLATE_CATEGORY.upi_double_debit).toBe("upi");
    expect(TEMPLATE_CATEGORY.food_missing_item).toBe("food");
    expect(TEMPLATE_CATEGORY.ecom_damaged).toBe("ecommerce");
  });
});
