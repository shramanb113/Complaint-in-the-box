import { describe, it, expect } from "vitest";
import { cn } from "../src/lib/cn";

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
  it("lets a later Tailwind class override an earlier conflicting one", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("cn with the Poster Pop theme tokens", () => {
  it("merges the custom radius tokens with each other and with stock radii", () => {
    expect(cn("rounded-card", "rounded-chip")).toBe("rounded-chip");
    expect(cn("rounded-field", "rounded-card")).toBe("rounded-card");
    expect(cn("rounded-card", "rounded-lg")).toBe("rounded-lg");
    expect(cn("rounded-lg", "rounded-field")).toBe("rounded-field");
  });

  it("merges the hard shadow tokens with each other and with stock shadows", () => {
    expect(cn("shadow-hard", "shadow-hard-lg")).toBe("shadow-hard-lg");
    expect(cn("shadow-hard-sm", "shadow-hard-xl")).toBe("shadow-hard-xl");
    expect(cn("shadow-hard", "shadow-md")).toBe("shadow-md");
    expect(cn("shadow-md", "shadow-hard")).toBe("shadow-hard");
  });

  it("does not treat a shadow colour as a replacement for a hard shadow size", () => {
    expect(cn("shadow-hard", "shadow-ink")).toBe("shadow-hard shadow-ink");
    expect(cn("shadow-hard-lg", "shadow-wa")).toBe("shadow-hard-lg shadow-wa");
  });

  it("merges the custom animation and easing tokens", () => {
    expect(cn("animate-pop", "animate-wobble")).toBe("animate-wobble");
    expect(cn("animate-wobble", "animate-spin")).toBe("animate-spin");
    expect(cn("ease-pop", "ease-in")).toBe("ease-in");
    expect(cn("ease-in", "ease-pop")).toBe("ease-pop");
  });

  it("still merges the custom colour tokens", () => {
    expect(cn("bg-cream", "bg-turmeric")).toBe("bg-turmeric");
    expect(cn("text-ink", "text-wa")).toBe("text-wa");
  });
});
