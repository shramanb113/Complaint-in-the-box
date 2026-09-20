// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kicker } from "../src/components/kicker";

describe("Kicker", () => {
  it("is a small uppercase mono label that grows to 14px in Hindi and has no letter-spacing bump", () => {
    render(<Kicker>Start here</Kicker>);
    const el = screen.getByText("Start here");
    expect(el.tagName).toBe("P");
    expect(el.className).toContain("font-mono");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("text-xs");
    expect(el.className).toContain("hi:text-sm");
  });

  it("merges a caller's className", () => {
    render(<Kicker className="mb-1">Sample</Kicker>);
    expect(screen.getByText("Sample").className).toContain("mb-1");
  });
});
