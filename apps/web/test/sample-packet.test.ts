import { describe, it, expect } from "vitest";
import { UTR_TOKEN } from "@nyaypatra/core";
import { buildSampleLetter } from "../src/lib/sample-packet";

describe("buildSampleLetter", () => {
  const sample = buildSampleLetter();

  it("produces a WhatsApp text in both languages that fits the 700-character cap", () => {
    expect(sample.whatsapp.en.length).toBeGreaterThan(100);
    expect(sample.whatsapp.en.length).toBeLessThanOrEqual(700);
    expect(sample.whatsapp.hi.length).toBeGreaterThan(100);
    expect(sample.whatsapp.hi.length).toBeLessThanOrEqual(700);
  });

  it("writes Hindi in Devanagari and never leaks the UTR placeholder", () => {
    expect(sample.whatsapp.hi).toMatch(/[ऀ-ॿ]/);
    expect(sample.whatsapp.en).not.toContain(UTR_TOKEN);
    expect(sample.whatsapp.hi).not.toContain(UTR_TOKEN);
  });

  it("is deterministic, so the prerendered page does not change from build to build", () => {
    expect(buildSampleLetter()).toEqual(sample);
  });

  it("states a reply deadline seven days after the fixed sample date", () => {
    expect(sample.deadlineDays).toBe(7);
    expect(sample.deadlineLabel).toBe("26 Sep 2026");
    expect(sample.whatsapp.en).toContain(sample.deadlineLabel);
    expect(sample.whatsapp.hi).toContain("26 सितंबर 2026");
  });

  it("uses a fictional store, never a real company's name or legal name", () => {
    for (const text of [sample.whatsapp.en, sample.whatsapp.hi]) {
      expect(text).toContain("Sample Mart");
      expect(text).not.toMatch(/flipkart|amazon|swiggy|zomato|meesho|myntra/i);
    }
  });
});
