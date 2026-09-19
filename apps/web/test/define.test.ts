import { describe, it, expect } from "vitest";
import { defineMessages, fill, placeholders } from "../src/lib/i18n/define";

describe("fill", () => {
  it("replaces every marker, including repeats and numbers", () => {
    expect(fill("{a} and {a}, {n} days", { a: "x", n: 7 })).toBe("x and x, 7 days");
  });

  it("leaves a marker with no value visible so the mistake is easy to spot", () => {
    expect(fill("Hi {name}", {})).toBe("Hi {name}");
  });
});

describe("placeholders", () => {
  it("lists the markers in a template, sorted, repeats included", () => {
    expect(placeholders("{b} then {a} then {b}")).toEqual(["a", "b", "b"]);
  });

  it("is empty when there are no markers", () => {
    expect(placeholders("plain text")).toEqual([]);
  });
});

describe("defineMessages", () => {
  it("returns both languages under their codes", () => {
    const messages = defineMessages({ title: "Hello" }, { title: "नमस्ते" });
    expect(messages.en.title).toBe("Hello");
    expect(messages.hi.title).toBe("नमस्ते");
  });
});
