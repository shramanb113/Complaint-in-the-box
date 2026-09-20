import { describe, it, expect } from "vitest";
import { DesiredRemedySchema, PlatformSchema, TemplateIdSchema, TEMPLATE_CATEGORY } from "@nyaypatra/core";
import { DEADLINE_DAYS, EMPTY_RAW, FIELD_ERRORS, FIELD_NAMES, LIMITS } from "../src/lib/intake/fields";
import { defaultRaw, formConfig, needsCompanyName } from "../src/lib/intake/form-config";
import { PLATFORM_NAMES } from "../src/lib/intake/platforms";
import { parseMoney } from "../src/lib/intake/money";
import { cleanText } from "../src/lib/intake/text";
import { parseIsoDate, todayIstIso } from "../src/lib/intake/dates";

describe("field names", () => {
  it("has an empty string for every field", () => {
    expect(Object.keys(EMPTY_RAW).sort()).toEqual([...FIELD_NAMES].sort());
    expect(Object.values(EMPTY_RAW).every((value) => value === "")).toBe(true);
  });

  it("lists every error code once", () => {
    expect(new Set(FIELD_ERRORS).size).toBe(FIELD_ERRORS.length);
    expect(FIELD_ERRORS).toContain("required");
    expect(FIELD_ERRORS).toContain("invalid");
  });

  it("mirrors the free-text limits of core's schema", () => {
    expect(LIMITS.whatHappened).toEqual({ min: 20, max: 400 });
    expect(LIMITS.alreadyDid.max).toBe(200);
    expect(LIMITS.companyName.max).toBe(60);
    expect(LIMITS.orderId.max).toBe(30);
    expect(LIMITS.city.max).toBe(50);
    expect(LIMITS.userDisplayName.max).toBe(50);
    expect(DEADLINE_DAYS).toEqual([2, 7, 15]);
  });
});

describe("formConfig", () => {
  it.each(TemplateIdSchema.options)("%s: offers real platforms ending in Other, and real remedies", (id) => {
    const config = formConfig(id);
    expect(config.category).toBe(TEMPLATE_CATEGORY[id]);
    expect(config.platforms.at(-1)).toBe("other");
    for (const platform of config.platforms) expect(PlatformSchema.options).toContain(platform);
    expect(config.remedies.length).toBeGreaterThan(0);
    for (const remedy of config.remedies) expect(DesiredRemedySchema.options).toContain(remedy);
  });

  it("asks a UPI payer who they paid, and never for an order id", () => {
    const config = formConfig("upi_double_debit");
    expect(config.companyNameAlways).toBe(true);
    expect(config.showOrderId).toBe(false);
    expect(config.platforms).toEqual(["gpay", "phonepe", "paytm", "other"]);
    expect(config.remedies).toEqual(["reverse_failed_upi"]);
  });

  it("asks for a delivery date only where the letter uses it", () => {
    const withDelivery = TemplateIdSchema.options.filter((id) => formConfig(id).showDeliveredOn);
    expect(withDelivery.sort()).toEqual(["ecom_damaged", "ecom_wrong_item"]);
  });

  it("asks for the listed price only for hidden-fee complaints", () => {
    const withListed = TemplateIdSchema.options.filter((id) => formConfig(id).showListedPrice);
    expect(withListed).toEqual(["fee_drip_pricing"]);
  });

  it("offers a choice of remedy only for a wrong or damaged item, defaulting to the first", () => {
    expect(formConfig("ecom_wrong_item").remedies).toEqual(["pickup_and_refund", "replacement", "full_refund_original_mode"]);
    expect(formConfig("ecom_damaged").remedies).toEqual(["full_refund_original_mode", "replacement"]);
    const fixed = TemplateIdSchema.options.filter((id) => formConfig(id).remedies.length === 1);
    expect(fixed).toHaveLength(8);
  });

  it("keeps food apps out of shopping and payment apps out of everything else", () => {
    expect(formConfig("food_missing_item").platforms).toEqual(["swiggy", "zomato", "other"]);
    expect(formConfig("ecom_damaged").platforms).not.toContain("swiggy");
    expect(formConfig("fee_drip_pricing").platforms).toContain("swiggy");
    expect(formConfig("fee_drip_pricing").platforms).not.toContain("gpay");
  });

  it("needs a company name for UPI always and elsewhere only for 'other'", () => {
    expect(needsCompanyName(formConfig("upi_double_debit"), "gpay")).toBe(true);
    expect(needsCompanyName(formConfig("ecom_damaged"), "flipkart")).toBe(false);
    expect(needsCompanyName(formConfig("ecom_damaged"), "other")).toBe(true);
    expect(needsCompanyName(formConfig("ecom_damaged"), "")).toBe(false);
  });

  it("starts with the default remedy, a 7-day deadline and no platform chosen", () => {
    const start = defaultRaw(formConfig("ecom_wrong_item"));
    expect(start.desiredRemedy).toBe("pickup_and_refund");
    expect(start.deadlineDays).toBe("7");
    expect(start.platform).toBe("");
    expect(start.whatHappened).toBe("");
  });
});

describe("PLATFORM_NAMES", () => {
  it("names every platform except 'other'", () => {
    const named = Object.keys(PLATFORM_NAMES).sort();
    expect(named).toEqual(PlatformSchema.options.filter((p) => p !== "other").sort());
    expect(PLATFORM_NAMES.gpay).toBe("Google Pay");
  });
});

describe("parseMoney", () => {
  it.each([
    ["2499", 2499],
    ["₹2,499", 2499],
    ["Rs. 2,499", 2499],
    ["rs2499", 2499],
    ["INR 2499", 2499],
    ["2,49,999", 249999],
    ["  1 299 ", 1299],
    ["1299.00", 1299],
    ["1299.0", 1299],
    ["१,२९९", 1299],
    ["0012", 12],
    ["999999999", 999999999],
  ])("reads %j as %i", (input, value) => {
    expect(parseMoney(input)).toEqual({ ok: true, value });
  });

  it.each([
    ["", "required"],
    ["   ", "required"],
    ["abc", "notNumber"],
    ["12a", "notNumber"],
    ["-5", "notNumber"],
    ["12.5.3", "notNumber"],
    ["1299.50", "notWholeRupees"],
    ["0", "notPositive"],
    ["0.00", "notPositive"],
    ["1000000000", "tooBig"],
    ["99999999999999999999", "tooBig"],
  ])("rejects %j as %s", (input, error) => {
    expect(parseMoney(input)).toEqual({ ok: false, error });
  });
});

describe("cleanText", () => {
  it("trims, uses one kind of newline and drops control characters", () => {
    expect(cleanText("  a\r\nb\rc\u0000d\u0007e  ")).toBe("a\nb\ncde");
  });

  it("keeps tabs, Hindi and emoji", () => {
    expect(cleanText("नमस्ते\t😀")).toBe("नमस्ते\t😀");
  });
});

describe("dates", () => {
  it("reports today's date in IST, which can already be tomorrow in UTC", () => {
    expect(todayIstIso(new Date("2026-09-15T19:30:00Z"))).toBe("2026-09-16");
    expect(todayIstIso(new Date("2026-09-15T10:00:00Z"))).toBe("2026-09-15");
  });

  it("accepts real calendar dates, trimmed", () => {
    expect(parseIsoDate("2026-09-16")).toEqual({ ok: true, value: "2026-09-16" });
    expect(parseIsoDate(" 2024-02-29 ")).toEqual({ ok: true, value: "2024-02-29" });
  });

  it.each(["2026-02-30", "26-09-16", "2026-9-6", "0099-01-01", "banana", "2026-13-01"])("rejects %j as a bad date", (input) => {
    expect(parseIsoDate(input)).toEqual({ ok: false, error: "badDate" });
  });

  it("asks for a date when there is none", () => {
    expect(parseIsoDate("")).toEqual({ ok: false, error: "required" });
  });
});
