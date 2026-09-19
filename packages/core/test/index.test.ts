import { describe, it, expect } from "vitest";
import * as core from "../src/index";

const NOW = new Date("2026-09-15T12:00:00Z");

describe("@nyaypatra/core public entry point", () => {
  it("exports exactly the documented runtime names and nothing else", () => {
    const expected = [
      "generatePacket",
      "createIntakeSchema",
      "IntakeSchema",
      "isNotFutureIsoDate",
      "TemplateIdSchema",
      "PlatformSchema",
      "CategorySchema",
      "DesiredRemedySchema",
      "LocaleSchema",
      "TEMPLATE_CATEGORY",
      "loadCompanyCatalog",
      "REMEDY_TEXT",
      "UTR_TOKEN",
      "normalizeUtr",
      "applyUtr",
      "nowToIstYMD",
      "computeDeadlineYMD",
      "addDaysToYMD",
      "ymdFromISODate",
      "formatYMDEn",
      "formatYMDHi",
      "formatInr",
      "formatInrNumber",
      "packetDeadline",
    ];
    for (const name of expected) {
      expect(core, name).toHaveProperty(name);
    }
    // Exact set: an accidental extra export must fail this test. Type-only exports have no runtime key.
    expect(Object.keys(core).sort()).toEqual([...expected].sort());
  });

  it("supports the whole server flow using only the public entry point", () => {
    const intake = {
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
    };
    const parsed = core.createIntakeSchema(NOW).parse(intake);
    const packet = core.generatePacket({ ...parsed, utr: core.UTR_TOKEN }, core.loadCompanyCatalog(), NOW);
    const final = core.applyUtr(packet, "409912345678");
    expect(final.artifacts.whatsapp.en).toContain("409912345678");
  });

  const ecommerceIntake = {
    category: "ecommerce",
    templateId: "ecom_wrong_item",
    locale: "both",
    platform: "flipkart",
    amountInr: 2499,
    paidOn: "2026-09-10",
    deliveredOn: "2026-09-14",
    whatHappened: "Wrong mixer delivered, cracked blade on arrival.",
    desiredRemedy: "pickup_and_refund",
    deadlineDays: 7,
  } as const;

  it("packetDeadline matches the deadline printed in the letter", () => {
    const packet = core.generatePacket(ecommerceIntake, core.loadCompanyCatalog(), NOW);
    const deadline = core.packetDeadline(packet);
    expect(deadline).toEqual(core.computeDeadlineYMD(7, NOW));
    expect(packet.artifacts.whatsapp.en).toContain(core.formatYMDEn(deadline));
  });

  it.each([
    // 19:00Z on 15 Sep is 00:30 IST on 16 Sep: the deadline must count from the IST day, not the UTC day.
    ["just after IST midnight (UTC day is still the 15th)", "2026-09-15T19:00:00Z", { y: 2026, m: 9, d: 23 }, "23 Sep 2026"],
    // 20:00Z on 25 Sep is 01:30 IST on 26 Sep; 26 + 7 days rolls over the month end into October.
    ["crossing a month end", "2026-09-25T20:00:00Z", { y: 2026, m: 10, d: 3 }, "3 Oct 2026"],
  ])("packetDeadline counts from the IST day: %s", (_label, iso, expectedYmd, expectedText) => {
    const packet = core.generatePacket(ecommerceIntake, core.loadCompanyCatalog(), new Date(iso));
    expect(core.packetDeadline(packet)).toEqual(expectedYmd);
    expect(packet.artifacts.whatsapp.en).toContain(expectedText);
  });
});
