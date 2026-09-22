import { describe, it, expect } from "vitest";
import { generatePacket, loadCompanyCatalog, TemplateIdSchema, UTR_TOKEN } from "@nyaypatra/core";
import { mapSchemaIssues, validateIntakeForm } from "../src/lib/intake/validate";
import { NOW, validRaw } from "./helpers/intake";

const ok = (id: Parameters<typeof validateIntakeForm>[0], overrides = {}) => validateIntakeForm(id, validRaw(id, overrides), NOW);
const errorsOf = (id: Parameters<typeof validateIntakeForm>[0], overrides = {}) => {
  const result = ok(id, overrides);
  if (result.ok) throw new Error("expected errors, got a valid intake");
  return result.errors;
};

describe("validateIntakeForm: a filled form", () => {
  it.each(TemplateIdSchema.options)("%s: builds an intake that generates a complete letter", (id) => {
    const result = ok(id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.intake.templateId).toBe(id);
    expect(result.intake.locale).toBe("both");
    expect("utr" in result.intake).toBe(false);
    const intake = result.intake.category === "upi" ? { ...result.intake, utr: UTR_TOKEN } : result.intake;
    const { whatsapp, emailBody } = generatePacket(intake, loadCompanyCatalog(), NOW).artifacts;
    for (const text of [whatsapp.en, whatsapp.hi, emailBody.en, emailBody.hi]) expect(text).not.toMatch(/\{\{/);
  });

  it("trims and normalises text, and accepts Hindi", () => {
    const result = ok("ecom_wrong_item", { whatHappened: "  मिक्सर की जगह दूसरा सामान मिला।\r\nब्लेड टूटा है।  " });
    expect(result.ok && result.intake.whatHappened).toBe("मिक्सर की जगह दूसरा सामान मिला।\nब्लेड टूटा है।");
  });

  it("drops optional fields that were left empty", () => {
    const result = ok("ecom_wrong_item", { orderId: "", alreadyDid: "", city: "", userDisplayName: "", deliveredOn: "" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const key of ["orderId", "alreadyDid", "city", "userDisplayName", "deliveredOn"] as const) {
      expect(result.intake[key]).toBeUndefined();
    }
  });

  it("ignores fields the template does not show, even when they are sent", () => {
    const result = ok("upi_double_debit", { orderId: "OD1", listedPriceInr: "5", deliveredOn: "2026-09-01" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.intake.orderId).toBeUndefined();
    expect(result.intake.listedPriceInr).toBeUndefined();
    expect(result.intake.deliveredOn).toBeUndefined();
  });

  it("never carries a UTR, even when the request tries to send one", () => {
    const sneaky = { ...validRaw("upi_double_debit"), utr: "409912345678" } as never;
    const result = validateIntakeForm("upi_double_debit", sneaky, NOW);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toContain("409912345678");
    expect(result.ok && "utr" in result.intake).toBe(false);
  });
});

describe("validateIntakeForm: what is required", () => {
  it("names every missing required field at once for an empty form", () => {
    const result = validateIntakeForm("ecom_wrong_item", {}, NOW);
    expect(result).toEqual({
      ok: false,
      errors: {
        platform: "required",
        amountInr: "required",
        paidOn: "required",
        whatHappened: "required",
        deadlineDays: "required",
      },
    });
  });

  it("asks a UPI payer who they paid", () => {
    expect(errorsOf("upi_double_debit", { companyName: "" })).toEqual({ companyName: "required" });
  });

  it("asks for a company name when the platform is 'other', and keeps it", () => {
    expect(errorsOf("ecom_damaged", { platform: "other", companyName: "" })).toEqual({ companyName: "required" });
    const result = ok("ecom_damaged", { platform: "other", companyName: "Local Furniture Store" });
    expect(result.ok && result.intake.platform).toBe("other");
    expect(result.ok && result.intake.companyName).toBe("Local Furniture Store");
  });

  it("asks a hidden-fee complaint for a listed price that is lower than the amount paid", () => {
    expect(errorsOf("fee_drip_pricing", { listedPriceInr: "" })).toEqual({ listedPriceInr: "required" });
    expect(errorsOf("fee_drip_pricing", { listedPriceInr: "2499" })).toEqual({ listedPriceInr: "listedNotLess" });
    expect(errorsOf("fee_drip_pricing", { listedPriceInr: "3000" })).toEqual({ listedPriceInr: "listedNotLess" });
  });
});

describe("validateIntakeForm: amounts", () => {
  it.each([
    ["12.5", "notWholeRupees"],
    ["abc", "notNumber"],
    ["0", "notPositive"],
    ["1000000000", "tooBig"],
  ] as const)("reports %j as %s", (value, code) => {
    expect(errorsOf("ecom_wrong_item", { amountInr: value })).toEqual({ amountInr: code });
  });

  it("reads Indian formats and Hindi digits", () => {
    const result = ok("ecom_wrong_item", { amountInr: "₹ १,२९९" });
    expect(result.ok && result.intake.amountInr).toBe(1299);
  });
});

describe("validateIntakeForm: dates", () => {
  it("accepts today (IST) and rejects tomorrow", () => {
    expect(ok("ecom_wrong_item", { paidOn: "2026-09-20", deliveredOn: "2026-09-20" }).ok).toBe(true);
    expect(errorsOf("ecom_wrong_item", { paidOn: "2026-09-21" })).toEqual({ paidOn: "futureDate" });
  });

  it("treats the IST date as today even when UTC is still yesterday", () => {
    const lateNight = new Date("2026-09-19T19:30:00Z"); // 01:00 IST on the 20th
    expect(validateIntakeForm("ecom_wrong_item", validRaw("ecom_wrong_item", { paidOn: "2026-09-20", deliveredOn: "2026-09-20" }), lateNight).ok).toBe(true);
  });

  it("rejects dates before 2016 and things that are not dates", () => {
    expect(errorsOf("ecom_wrong_item", { paidOn: "2015-12-31" })).toEqual({ paidOn: "tooOld" });
    expect(errorsOf("ecom_wrong_item", { paidOn: "banana" })).toEqual({ paidOn: "badDate" });
    expect(errorsOf("ecom_wrong_item", { paidOn: "2026-02-30" })).toEqual({ paidOn: "badDate" });
  });

  it("accepts exactly the 2016-01-01 floor for both dates", () => {
    expect(ok("ecom_wrong_item", { paidOn: "2016-01-01", deliveredOn: "2016-01-01" }).ok).toBe(true);
    expect(errorsOf("ecom_wrong_item", { deliveredOn: "2015-12-31" })).toEqual({ deliveredOn: "tooOld" });
  });

  it("makes the delivery date optional but still checks it when given", () => {
    expect(ok("ecom_wrong_item", { deliveredOn: "" }).ok).toBe(true);
    expect(errorsOf("ecom_wrong_item", { deliveredOn: "2026-09-25" })).toEqual({ deliveredOn: "futureDate" });
    expect(errorsOf("ecom_wrong_item", { deliveredOn: "nope" })).toEqual({ deliveredOn: "badDate" });
  });

  it("rejects a delivery date before the payment date", () => {
    expect(errorsOf("ecom_wrong_item", { paidOn: "2026-09-10", deliveredOn: "2026-09-05" })).toEqual({
      deliveredOn: "beforePaid",
    });
    expect(ok("ecom_wrong_item", { paidOn: "2026-09-10", deliveredOn: "2026-09-10" }).ok).toBe(true);
  });
});

describe("validateIntakeForm: text", () => {
  it("enforces the narrative length", () => {
    expect(errorsOf("ecom_wrong_item", { whatHappened: "x".repeat(19) })).toEqual({ whatHappened: "tooShort" });
    expect(ok("ecom_wrong_item", { whatHappened: "x".repeat(20) }).ok).toBe(true);
    expect(ok("ecom_wrong_item", { whatHappened: "x".repeat(400) }).ok).toBe(true);
    expect(errorsOf("ecom_wrong_item", { whatHappened: "x".repeat(401) })).toEqual({ whatHappened: "tooLong" });
  });

  it.each([
    ["alreadyDid", 201],
    ["orderId", 31],
    ["city", 51],
    ["userDisplayName", 51],
  ] as const)("limits %s", (field, length) => {
    expect(errorsOf("ecom_wrong_item", { [field]: "x".repeat(length) })).toEqual({ [field]: "tooLong" });
  });

  it("limits the company name", () => {
    expect(errorsOf("upi_double_debit", { companyName: "x".repeat(61) })).toEqual({ companyName: "tooLong" });
  });

  it("refuses the reserved UTR marker in any free-text field", () => {
    for (const field of ["whatHappened", "alreadyDid", "orderId", "city", "userDisplayName"] as const) {
      const value = field === "whatHappened" ? `It went wrong ${UTR_TOKEN} again and again` : `A ${UTR_TOKEN}`;
      expect(errorsOf("ecom_wrong_item", { [field]: value }), field).toEqual({ [field]: "reservedText" });
    }
    expect(errorsOf("upi_double_debit", { companyName: UTR_TOKEN })).toEqual({ companyName: "reservedText" });
  });
});

describe("validateIntakeForm: choices", () => {
  it("only accepts platforms offered for the category", () => {
    expect(errorsOf("ecom_wrong_item", { platform: "bogus" })).toEqual({ platform: "invalidChoice" });
    expect(errorsOf("ecom_wrong_item", { platform: "swiggy" })).toEqual({ platform: "invalidChoice" });
    expect(ok("food_wrong_item", { platform: "swiggy" }).ok).toBe(true);
  });

  it("only accepts a remedy the template offers, and defaults when none is sent", () => {
    expect(errorsOf("upi_double_debit", { desiredRemedy: "replacement" })).toEqual({ desiredRemedy: "invalidChoice" });
    const result = ok("ecom_wrong_item", { desiredRemedy: "" });
    expect(result.ok && result.intake.desiredRemedy).toBe("pickup_and_refund");
  });

  it("only accepts 2, 7 or 15 days", () => {
    expect(errorsOf("ecom_wrong_item", { deadlineDays: "3" })).toEqual({ deadlineDays: "invalidChoice" });
    const result = ok("ecom_wrong_item", { deadlineDays: "15" });
    expect(result.ok && result.intake.deadlineDays).toBe(15);
  });
});

describe("validateIntakeForm: several problems at once", () => {
  it("reports them all so a person can fix everything in one pass", () => {
    const errors = errorsOf("ecom_wrong_item", { paidOn: "2026-09-21", whatHappened: "short", amountInr: "abc" });
    expect(errors).toEqual({ paidOn: "futureDate", whatHappened: "tooShort", amountInr: "notNumber" });
  });
});

describe("mapSchemaIssues", () => {
  it("turns core's issue messages into field errors", () => {
    expect(
      mapSchemaIssues([
        { path: ["paidOn"], message: "Date cannot be in the future" },
        { path: ["deliveredOn"], message: "Date cannot be before 2016-01-01" },
        { path: ["companyName"], message: "companyName is required when platform is 'other'" },
        { path: ["listedPriceInr"], message: "listedPriceInr is required and must be less than amountInr for fee_drip_pricing" },
        { path: ["city"], message: "Text cannot contain the reserved marker [[UTR]]" },
      ])
    ).toEqual({
      paidOn: "futureDate",
      deliveredOn: "tooOld",
      companyName: "required",
      listedPriceInr: "listedNotLess",
      city: "reservedText",
    });
  });

  it("falls back to a generic error, on the first field when the path is not a form field", () => {
    expect(mapSchemaIssues([{ path: ["orderId"], message: "something new" }])).toEqual({ orderId: "invalid" });
    expect(mapSchemaIssues([{ path: ["templateId"], message: "x" }])).toEqual({ platform: "invalid" });
    expect(mapSchemaIssues([{ path: [], message: "x" }])).toEqual({ platform: "invalid" });
  });

  it("keeps the first error for a field", () => {
    expect(
      mapSchemaIssues([
        { path: ["paidOn"], message: "Date cannot be in the future" },
        { path: ["paidOn"], message: "Date cannot be before 2016-01-01" },
      ])
    ).toEqual({ paidOn: "futureDate" });
  });
});
