import { describe, it, expect } from "vitest";
import { generatePacket } from "../src/generatePacket";
import { loadCompanyCatalog } from "../src/companies";
import { createIntakeSchema, TemplateIdSchema } from "../src/schema";
import { TEMPLATE_CATEGORY } from "../src/templateCategory";
import { computeDeadlineYMD, formatYMDEn } from "../src/dates";
import { UTR_TOKEN, applyUtr } from "../src/utr";
import type { Intake } from "../src/types";

const NOW = new Date("2026-09-15T12:00:00Z");
const catalog = loadCompanyCatalog();

// Every free-text field at its schema maximum, platform "other" so the
// (60-char) company name is used for both the app and recipient labels.
// Deliberate tripwire: with no alreadyDid this maxed case lands on exactly 700
// (zero headroom in M1), so any template edit that grows it must fail the sweep.
const MAXED = {
  locale: "both",
  platform: "other",
  companyName: "C".repeat(60),
  orderId: "O".repeat(30),
  utr: "U".repeat(35),
  amountInr: 999999999,
  listedPriceInr: 1,
  paidOn: "2026-09-14",
  deliveredOn: "2026-09-14",
  city: "T".repeat(50),
  state: "S".repeat(50),
  userDisplayName: "N".repeat(50),
  whatHappened: "w".repeat(400),
  alreadyDid: "a".repeat(200),
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 15,
} as const;

describe("WhatsApp budget with every free-text field at its maximum", () => {
  it.each(TemplateIdSchema.options)(
    "%s: stays within 700 characters (en and hi) and keeps the deadline line",
    (templateId) => {
      const intake = { ...MAXED, category: TEMPLATE_CATEGORY[templateId], templateId } as Intake;
      expect(() => createIntakeSchema(NOW).parse(intake)).not.toThrow();

      const wa = generatePacket(intake, catalog, NOW).artifacts.whatsapp;
      expect(wa.en.length).toBeLessThanOrEqual(700);
      expect(wa.hi.length).toBeLessThanOrEqual(700);
      expect(wa.en).toContain(formatYMDEn(computeDeadlineYMD(15, NOW)));
      expect(wa.en).not.toMatch(/\{\{/);
      expect(wa.hi).not.toMatch(/\{\{/);
    }
  );

  it.each(TemplateIdSchema.options)(
    "%s: still ≤ 700 after the browser swaps the UTR token for a 35-char UTR, a missing UTR, or an invalid one",
    (templateId) => {
      const intake = {
        ...MAXED,
        category: TEMPLATE_CATEGORY[templateId],
        templateId,
        utr: UTR_TOKEN,
      } as Intake;
      const packet = generatePacket(intake, catalog, NOW);
      // Guard against a vacuous sweep: UPI templates must really carry the token pre-swap.
      if (TEMPLATE_CATEGORY[templateId] === "upi") {
        expect(packet.artifacts.whatsapp.en).toContain(UTR_TOKEN);
        expect(packet.artifacts.whatsapp.hi).toContain(UTR_TOKEN);
      }
      for (const input of ["U".repeat(35), undefined, "not a utr!"]) {
        const wa = applyUtr(packet, input).artifacts.whatsapp;
        expect(wa.en.length, `en, input=${String(input)}`).toBeLessThanOrEqual(700);
        expect(wa.hi.length, `hi, input=${String(input)}`).toBeLessThanOrEqual(700);
        expect(wa.en).not.toContain(UTR_TOKEN);
        expect(wa.hi).not.toContain(UTR_TOKEN);
      }
    }
  );

  it.each(TemplateIdSchema.options.filter((id) => TEMPLATE_CATEGORY[id] === "upi"))(
    "%s: counts every [[UTR]] the user typed into the narrative, not just the template's own",
    (templateId) => {
      const intake = {
        ...MAXED,
        category: "upi",
        templateId,
        utr: UTR_TOKEN,
        whatHappened: `${UTR_TOKEN} `.repeat(50).slice(0, 400),
      } as Intake;
      const packet = generatePacket(intake, catalog, NOW);
      const wa = packet.artifacts.whatsapp;
      expect(wa.en.length, "en, pre-swap").toBeLessThanOrEqual(700);
      expect(wa.hi.length, "hi, pre-swap").toBeLessThanOrEqual(700);
      for (const input of ["U".repeat(35), undefined]) {
        const after = applyUtr(packet, input).artifacts.whatsapp;
        expect(after.en.length, `en, input=${String(input)}`).toBeLessThanOrEqual(700);
        expect(after.hi.length, `hi, input=${String(input)}`).toBeLessThanOrEqual(700);
      }
    }
  );

  it("never cuts an emoji in half when shrinking (no lone surrogate, so encodeURIComponent cannot throw)", () => {
    const emoji = "\u{1F600}";
    for (const template of ["ecom_wrong_item", "upi_double_debit"] as const) {
      for (let len = 380; len <= 400; len++) {
        // "x" padding flips the parity of the cut point relative to the surrogate pairs.
        const pad = len % 2;
        const emojiText = (n: number) => "x".repeat(pad) + emoji.repeat(Math.floor((n - pad) / 2));
        const intake = {
          ...MAXED,
          category: TEMPLATE_CATEGORY[template],
          templateId: template,
          whatHappened: emojiText(len),
          alreadyDid: emojiText(100 + (len % 100)),
        } as Intake;
        const wa = generatePacket(intake, catalog, NOW).artifacts.whatsapp;
        for (const text of [wa.en, wa.hi]) {
          expect(text.length, `${template} len=${len}`).toBeLessThanOrEqual(700);
          expect(() => encodeURIComponent(text), `${template} len=${len}`).not.toThrow();
        }
      }
    }
  });

  it("shrinks the 'already tried' line before the user's own narrative", () => {
    const intake: Intake = {
      category: "ecommerce",
      templateId: "ecom_wrong_item",
      locale: "both",
      platform: "flipkart",
      orderId: "OD1",
      amountInr: 2499,
      paidOn: "2026-09-14",
      deliveredOn: "2026-09-14",
      whatHappened: "w".repeat(300),
      alreadyDid: "a".repeat(200),
      desiredRemedy: "pickup_and_refund",
      deadlineDays: 7,
    };
    const wa = generatePacket(intake, catalog, NOW).artifacts.whatsapp.en;
    expect(wa.length).toBeLessThanOrEqual(700);
    expect(wa).toContain("w".repeat(300));
    expect(wa).toContain("…");
  });
});
