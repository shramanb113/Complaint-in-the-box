import { describe, it, expect } from "vitest";
import { formatInrNumber, formatInr } from "../src/money";

describe("formatInrNumber", () => {
  it("groups thousands with a single comma below one lakh", () => {
    expect(formatInrNumber(2499)).toBe("2,499");
  });

  it("uses Indian digit grouping (lakh) for six-digit values", () => {
    // Guards against a small-ICU Node environment silently falling back to
    // Western-style grouping (which would produce "150,000").
    expect(formatInrNumber(150000)).toBe("1,50,000");
  });

  it("uses Indian digit grouping (crore) for eight-digit values", () => {
    expect(formatInrNumber(10000000)).toBe("1,00,00,000");
  });
});

describe("formatInr", () => {
  it("prefixes the rupee symbol", () => {
    expect(formatInr(8000)).toBe("₹8,000");
  });

  it("prefixes the rupee symbol with Indian grouping for larger amounts", () => {
    expect(formatInr(150000)).toBe("₹1,50,000");
  });
});
