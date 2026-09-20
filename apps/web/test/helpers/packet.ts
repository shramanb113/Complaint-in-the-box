import { generatePacket, loadCompanyCatalog, type Intake, type Packet } from "@nyaypatra/core";

export const SAVED_AT = new Date("2026-09-20T06:00:00Z");

const INTAKE: Intake = {
  category: "ecommerce",
  templateId: "ecom_wrong_item",
  locale: "both",
  platform: "flipkart",
  orderId: "OD1234",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  city: "Pune",
  whatHappened: "मिक्सर की जगह दूसरा सामान मिला। Wrong item, blade cracked.",
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

/** A real generated packet with a chosen id and creation time. */
export function samplePacket(id = "01K5ZZZZZZZZZZZZZZZZZZZZZZ", createdAt: Date = SAVED_AT): Packet {
  return { ...generatePacket(INTAKE, loadCompanyCatalog(), createdAt), id };
}
