import { generatePacket } from "./generatePacket";
import { loadCompanyCatalog } from "./companies";
import type { Intake } from "./types";

const fixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_wrong_item",
  locale: "en",
  platform: "flipkart",
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "wrong mixer, cracked blade",
  alreadyDid: "raised in-app ticket",
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

const packet = generatePacket(fixture, loadCompanyCatalog());

console.log("--- WhatsApp (en) ---");
console.log(packet.artifacts.whatsapp.en);
console.log("\n--- WhatsApp (hi) ---");
console.log(packet.artifacts.whatsapp.hi);
