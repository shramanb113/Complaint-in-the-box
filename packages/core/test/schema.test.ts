import { describe, it, expect } from "vitest";
import { IntakeSchema } from "../src/schema";

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
});
