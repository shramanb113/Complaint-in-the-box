import { describe, it, expect } from "vitest";
import { z } from "zod";
import { IntakeSchema, createIntakeSchema } from "../src/schema";
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

describe("IntakeSchema type", () => {
  it("IntakeSchema's inferred output satisfies the Intake interface (compile-time check)", () => {
    // If IntakeSchema's inferred type ever diverges from Intake, this
    // assignment fails to compile under `tsc --noEmit` — that's the point.
    const _typeCheck: Intake = {} as z.infer<typeof IntakeSchema>;
    expect(_typeCheck).toBeDefined();
  });
});
