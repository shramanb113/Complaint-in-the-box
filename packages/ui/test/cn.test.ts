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
