import { describe, it, expect } from "vitest";
import { placeholders } from "../src/lib/i18n/define";
import { landingMessages } from "../src/lib/i18n/messages/landing";

describe("landingMessages", () => {
  it("has the section sizes the page layout expects, in both languages", () => {
    for (const locale of ["en", "hi"] as const) {
      const t = landingMessages[locale];
      expect(t.whatYouGet.items).toHaveLength(3);
      expect(t.howItWorks.steps).toHaveLength(3);
      expect(t.promises.items).toHaveLength(4);
    }
  });

  it("gives the deadline text the date and days markers the page fills in", () => {
    expect(placeholders(landingMessages.en.sample.deadline)).toEqual(["date", "days"]);
    expect(placeholders(landingMessages.hi.sample.deadline)).toEqual(["date", "days"]);
  });

  it("promises the UTR stays on the device, in both languages", () => {
    expect(landingMessages.en.promises.items[1].title).toContain("UTR");
    expect(landingMessages.hi.promises.items[1].title).toContain("UTR");
  });

  it("states retention and no-sale on the landing page and the form, in both languages", () => {
    for (const l of ["en", "hi"] as const) {
      expect(landingMessages[l].ctaTrust).toContain("7");
      expect(landingMessages[l].promises.items[0].body).toContain("7");
    }
    expect(landingMessages.en.ctaTrust).toContain("Never sold");
  });
});
