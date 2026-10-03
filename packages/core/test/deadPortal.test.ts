import { describe, expect, it } from "vitest";
import { generatePacket } from "../src/generatePacket";
import { loadCompanyCatalog } from "../src/companies";
import type { Intake } from "../src/types";

const intake: Intake = {
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

describe("decommissioned portals", () => {
  it("never mentions e-Daakhil in a generated packet", () => {
    const packet = generatePacket(intake, loadCompanyCatalog(), new Date("2026-09-15T12:00:00Z"));
    const text = JSON.stringify(packet).toLowerCase();
    expect(text).not.toContain("daakhil");
    expect(text).toContain("e-jagriti.gov.in");
  });
});
