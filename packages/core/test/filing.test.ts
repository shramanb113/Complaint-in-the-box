import { describe, expect, it } from "vitest";
import {
  checkFilingReadiness,
  buildFilingKit,
  buildNchBlock,
  suggestForum,
  READINESS_MESSAGES,
  type FilingFacts,
} from "../src/filing";
import { loadCompanyCatalog } from "../src/companies";
import type { Intake } from "../src/types";

const NOW = new Date("2026-10-03T12:00:00Z");
const catalog = loadCompanyCatalog();

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
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

const facts: FilingFacts = {
  amountClaimed: 2499,
  issueOn: "2026-09-14",
  firstComplaintOn: "2026-09-15",
  lastReplyOn: "2026-09-20",
  companyTicketRef: "TKT-889",
  companyReplyReason: "Item delivered as ordered",
  evidenceHave: ["order_confirmation", "payment_proof", "photos_video"],
  complainant: {
    fullName: "Asha Verma",
    addressLine: "12 MG Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    mobile: "9876543210",
    email: "asha@example.com",
    addressType: "present",
  },
  opposite: {
    legalName: "Flipkart Internet Private Limited",
    registeredOffice: "Buildings Alyssa, Bengaluru 560103",
  },
};

const codes = (r: ReturnType<typeof checkFilingReadiness>) => r.blockers.map((b) => b.code);

describe("checkFilingReadiness", () => {
  it("passes a complete, in-order filing", () => {
    const r = checkFilingReadiness(intake, facts, NOW);
    expect(r.ready).toBe(true);
    expect(r.blockers).toEqual([]);
  });

  it("blocks when required complainant fields are missing", () => {
    const r = checkFilingReadiness(intake, { ...facts, complainant: { ...facts.complainant, pincode: "12" } }, NOW);
    expect(r.ready).toBe(false);
    expect(r.blockers.map((b) => b.field)).toContain("complainant.pincode");
  });

  it("blocks a missing registered office", () => {
    const r = checkFilingReadiness(intake, { ...facts, opposite: { ...facts.opposite, registeredOffice: " " } }, NOW);
    expect(codes(r)).toContain("missing_field");
    expect(r.blockers.map((b) => b.field)).toContain("opposite.registeredOffice");
  });

  it("blocks dates out of order", () => {
    const r = checkFilingReadiness(intake, { ...facts, firstComplaintOn: "2026-09-12" }, NOW);
    expect(codes(r)).toContain("date_order");
  });

  it("blocks a cause-of-action date before the payment date", () => {
    const r = checkFilingReadiness(intake, { ...facts, issueOn: "2026-09-01" }, NOW);
    expect(codes(r)).toContain("date_order");
  });

  it("blocks a future last-reply date", () => {
    const r = checkFilingReadiness(intake, { ...facts, lastReplyOn: "2026-10-09" }, NOW);
    expect(codes(r)).toContain("date_order");
  });

  it("blocks a refund claim above the amount paid", () => {
    const r = checkFilingReadiness(intake, { ...facts, amountClaimed: 5000 }, NOW);
    expect(codes(r)).toContain("claim_exceeds_paid");
  });

  it("warns, without blocking, when near the two-year limit", () => {
    const old = { ...intake, paidOn: "2025-01-01" };
    const r = checkFilingReadiness(old, { ...facts, issueOn: "2025-01-10", firstComplaintOn: undefined, lastReplyOn: undefined }, NOW);
    expect(r.ready).toBe(true);
    expect(r.warnings.map((w) => w.code)).toContain("nearing_limitation");
  });

  it("warns when past two years", () => {
    const old = { ...intake, paidOn: "2024-01-01" };
    const r = checkFilingReadiness(old, { ...facts, issueOn: "2024-01-10", firstComplaintOn: undefined, lastReplyOn: undefined }, NOW);
    expect(r.ready).toBe(true);
    expect(r.warnings.map((w) => w.code)).toContain("past_limitation");
  });

  it("warns when the company was never approached", () => {
    const r = checkFilingReadiness(intake, { ...facts, firstComplaintOn: undefined, lastReplyOn: undefined }, NOW);
    expect(r.warnings.map((w) => w.code)).toContain("not_approached");
  });

  it("warns when there is no evidence", () => {
    const r = checkFilingReadiness(intake, { ...facts, evidenceHave: [] }, NOW);
    expect(r.warnings.map((w) => w.code)).toContain("no_evidence");
  });

  it("warns about a different forum above Rs 50 lakh", () => {
    const big = { ...intake, amountInr: 6_000_000 };
    const r = checkFilingReadiness(big, { ...facts, amountClaimed: 6_000_000 }, NOW);
    expect(r.warnings.map((w) => w.code)).toContain("other_forum");
  });

  it("has an English and a Hindi message for every code", () => {
    for (const [code, m] of Object.entries(READINESS_MESSAGES)) {
      expect(m.en.length, code).toBeGreaterThan(5);
      expect(m.hi.length, code).toBeGreaterThan(5);
      expect(/[\u0900-\u097F]/.test(m.hi), code).toBe(true);
    }
  });
});

describe("suggestForum", () => {
  it("maps consideration paid to a forum", () => {
    expect(suggestForum(2499)).toBe("district");
    expect(suggestForum(5_000_000)).toBe("district");
    expect(suggestForum(5_000_001)).toBe("state");
    expect(suggestForum(20_000_001)).toBe("national");
  });
});

describe("buildNchBlock", () => {
  it("lists NCH fields in order with the prior complaint and dated description", () => {
    const rows = buildNchBlock(intake, facts, catalog);
    expect(rows.map((r) => r.label)).toEqual([
      "Company",
      "Purchase city",
      "Product or service value",
      "Prior complaint to the company",
      "Complaint description",
      "Documents to attach",
    ]);
    const text = rows.map((r) => r.value).join("\n");
    expect(text).toContain("Flipkart Internet Private Limited");
    expect(text).toContain("TKT-889");
    expect(text).toContain("14 Sep 2026");
    expect(text).toContain("Item delivered as ordered");
    expect(text).not.toMatch(/please (provide|share|give)/i);
  });
});

describe("buildFilingKit", () => {
  const kit = buildFilingKit(intake, facts, catalog, NOW);

  it("gives e-Jagriti case details in portal order", () => {
    expect(kit.caseDetails.map((r) => r.label)).toEqual([
      "Amount paid",
      "Claim amount",
      "Date of cause of action",
      "State",
      "District / city",
      "Suggested commission",
      "Case category",
    ]);
  });

  it("includes the six portal documents, with the affidavit marked for notarisation", () => {
    expect(kit.documents.map((d) => d.title)).toEqual([
      "Index",
      "Proforma",
      "Synopsis with list of dates",
      "Memo of Parties",
      "Complaint",
      "Affidavit",
    ]);
    const aff = kit.documents.find((d) => d.title === "Affidavit")!;
    expect(aff.note).toMatch(/notar/i);
  });

  it("builds annexures only from evidence the user has", () => {
    expect(kit.annexures.map((a) => a.title)).toEqual([
      "Annexure A: Order confirmation",
      "Annexure B: Proof of payment",
      "Annexure C: Photographs or video",
    ]);
  });

  it("never mentions the decommissioned portal and contains no fill-in prompts", () => {
    const all = JSON.stringify(kit);
    expect(all.toLowerCase()).not.toContain("daakhil");
    expect(all).not.toMatch(/please (provide|share|give)/i);
    expect(all).not.toContain("[[");
  });

  it("lists the portal steps in the NIC order", () => {
    expect(kit.portalSteps[0]).toMatch(/File New Case/);
    expect(kit.portalSteps.at(-1)).toMatch(/irreversible|cannot be edited/i);
  });
});
