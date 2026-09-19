import { computeDeadlineYMD, formatYMDEn, generatePacket, loadCompanyCatalog, type Intake } from "@nyaypatra/core";

/** Fixed on purpose: a moving date would change the prerendered page on every build. 12:00 IST. */
const SAMPLE_NOW = new Date("2026-09-19T06:30:00Z");

/*
 * A fictional store, not a real company: company legal names in the catalog are still
 * unverified, and a public page must not put one in a letter. People write the story in
 * their own language, so each locale gets a narrative in that language.
 */
const BASE_INTAKE: Intake = {
  category: "ecommerce",
  templateId: "ecom_wrong_item",
  locale: "en",
  platform: "other",
  companyName: "Sample Mart",
  orderId: "OD1234",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "I ordered a hair trimmer and received a different item with a cracked blade.",
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

const HINDI_STORY = "मैंने हेयर ट्रिमर ऑर्डर किया था, लेकिन दूसरा सामान मिला और उसका ब्लेड टूटा हुआ है।";

/** A real letter from the real generator, using made-up order details. Shown on the pre-launch page. */
export function buildSampleLetter() {
  const catalog = loadCompanyCatalog();
  const en = generatePacket(BASE_INTAKE, catalog, SAMPLE_NOW);
  const hi = generatePacket({ ...BASE_INTAKE, locale: "hi", whatHappened: HINDI_STORY }, catalog, SAMPLE_NOW);
  return {
    whatsapp: { en: en.artifacts.whatsapp.en, hi: hi.artifacts.whatsapp.hi },
    deadlineDays: BASE_INTAKE.deadlineDays,
    deadlineLabel: formatYMDEn(computeDeadlineYMD(BASE_INTAKE.deadlineDays, SAMPLE_NOW)),
  };
}
