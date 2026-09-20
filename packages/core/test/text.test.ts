import { describe, it, expect, vi } from "vitest";
import { truncateGraphemes } from "../src/text";

describe("truncateGraphemes", () => {
  it("returns short text unchanged", () => {
    expect(truncateGraphemes("hello", 10)).toBe("hello");
  });

  it("cuts plain text at the limit", () => {
    expect(truncateGraphemes("hello world", 5)).toBe("hello");
  });

  it("returns an empty string for a limit of zero or less", () => {
    expect(truncateGraphemes("hello", 0)).toBe("");
    expect(truncateGraphemes("hello", -3)).toBe("");
  });

  it("never splits a Devanagari conjunct or vowel sign", () => {
    // क्ष = 3 code units, त्रि = 4, य = 1 (8 in total). A cut inside a cluster must drop the whole cluster.
    expect(truncateGraphemes("क्षत्रिय", 2)).toBe("");
    expect(truncateGraphemes("क्षत्रिय", 3)).toBe("क्ष");
    expect(truncateGraphemes("क्षत्रिय", 6)).toBe("क्ष");
    expect(truncateGraphemes("क्षत्रिय", 7)).toBe("क्षत्रि");
    expect(truncateGraphemes("ऑर्डर", 3)).toBe("ऑ");
    expect(truncateGraphemes("ऑर्डर", 4)).toBe("ऑर्ड");
  });

  it("keeps an emoji family sequence whole", () => {
    const family = "\u{1F468}‍\u{1F469}‍\u{1F467}"; // 8 code units, one character
    expect(truncateGraphemes(`ab${family}cd`, 5)).toBe("ab");
    expect(truncateGraphemes(`ab${family}cd`, 10)).toBe(`ab${family}`);
    expect(truncateGraphemes(`ab${family}cd`, 11)).toBe(`ab${family}c`);
  });

  it("falls back to code points when Intl.Segmenter is missing, so old browsers still work", async () => {
    const original = Intl.Segmenter;
    Reflect.set(Intl, "Segmenter", undefined);
    try {
      vi.resetModules();
      const fresh = await import("../src/text");
      expect(fresh.truncateGraphemes("ab\u{1F600}cd", 3)).toBe("ab");
      // The two paths differ here: code points keep "क्" (2 units), the Segmenter path drops the whole conjunct.
      expect(fresh.truncateGraphemes("क्षत्रिय", 2)).toBe("क्");
    } finally {
      Reflect.set(Intl, "Segmenter", original);
    }
    expect(truncateGraphemes("क्षत्रिय", 2)).toBe("");
  });
});
