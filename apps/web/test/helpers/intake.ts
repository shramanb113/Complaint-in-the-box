import type { TemplateId } from "@nyaypatra/core";
import { EMPTY_RAW, type RawIntake } from "../../src/lib/intake/fields";
import { formConfig, needsCompanyName } from "../../src/lib/intake/form-config";

/** 11:30 IST on 20 September 2026. */
export const NOW = new Date("2026-09-20T06:00:00Z");

/** A completely valid form for a template, as the browser would send it. */
export function validRaw(templateId: TemplateId, overrides: Partial<RawIntake> = {}): RawIntake {
  const config = formConfig(templateId);
  const platform = config.platforms[0];
  return {
    ...EMPTY_RAW,
    platform,
    companyName: needsCompanyName(config, platform) ? "Sharma Electricians" : "",
    orderId: config.showOrderId ? "OD123456" : "",
    amountInr: "2,499",
    listedPriceInr: config.showListedPrice ? "1,999" : "",
    paidOn: "2025-06-10",
    deliveredOn: config.showDeliveredOn ? "2025-06-14" : "",
    whatHappened: "The item never reached me even after the promised date passed.",
    alreadyDid: "Chatted with support twice.",
    desiredRemedy: config.remedies[0],
    deadlineDays: "7",
    city: "Pune",
    userDisplayName: "Asha",
    ...overrides,
  };
}
