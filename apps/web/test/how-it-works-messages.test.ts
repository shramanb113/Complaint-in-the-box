import { describe, it, expect } from "vitest";
import { howItWorksMessages } from "../src/lib/i18n/messages/how-it-works";

describe("howItWorksMessages", () => {
  it("has four steps and three data promises in both languages", () => {
    for (const locale of ["en", "hi"] as const) {
      expect(howItWorksMessages[locale].steps).toHaveLength(4);
      expect(howItWorksMessages[locale].data.bullets).toHaveLength(3);
    }
  });

  it("states the UTR and 7-day promises the privacy page also makes", () => {
    const bullets = howItWorksMessages.en.data.bullets.join(" ");
    expect(bullets).toContain("UTR");
    expect(bullets).toContain("7 days");
  });

  it("never promises a refund or legal advice", () => {
    const text = JSON.stringify(howItWorksMessages.en).toLowerCase();
    expect(text).not.toMatch(/guarantee|we will get your money|legal advice from us/);
  });
});
