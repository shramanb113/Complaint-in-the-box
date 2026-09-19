import { describe, it, expect } from "vitest";
import * as core from "../src/index";

const NOW = new Date("2026-09-15T12:00:00Z");

describe("@nyaypatra/core public entry point", () => {
  it("exposes the engine, schema, dates, money, catalog and UTR helpers", () => {
    for (const name of [
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
    ]) {
      expect(core, name).toHaveProperty(name);
    }
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

  it("packetDeadline matches the deadline printed in the letter", () => {
    const packet = core.generatePacket(
      {
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
      },
      core.loadCompanyCatalog(),
      NOW
    );
    const deadline = core.packetDeadline(packet);
    expect(deadline).toEqual(core.computeDeadlineYMD(7, NOW));
    expect(packet.artifacts.whatsapp.en).toContain(core.formatYMDEn(deadline));
  });
});
