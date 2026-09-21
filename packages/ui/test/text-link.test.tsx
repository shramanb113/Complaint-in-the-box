import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TextLink, textLinkVariants } from "../src/components/text-link";

describe("TextLink", () => {
  it("renders an anchor with the underline treatment and a 44px tap target", () => {
    render(<TextLink href="/legal/privacy">Privacy</TextLink>);
    const link = screen.getByRole("link", { name: "Privacy" });
    expect(link).toHaveAttribute("href", "/legal/privacy");
    expect(link.className).toContain("underline");
    expect(link.className).toContain("min-h-11");
    expect(link.className).not.toContain("text-sm");
  });

  it("adds text-sm for size=sm and font-display for display", () => {
    render(<TextLink href="/x" size="sm" display>Small</TextLink>);
    expect(screen.getByRole("link", { name: "Small" }).className).toEqual(expect.stringContaining("text-sm"));
    expect(screen.getByRole("link", { name: "Small" }).className).toEqual(expect.stringContaining("font-display"));
  });

  it("lets a caller's className override the default display, without losing the underline", () => {
    render(<TextLink href="/x" className="hidden sm:inline-flex">Header link</TextLink>);
    const link = screen.getByRole("link", { name: "Header link" });
    expect(link.className).toContain("hidden");
    expect(link.className).toContain("sm:inline-flex");
    expect(link.className).toContain("underline");
  });

  it("textLinkVariants() returns the same classes for next/link callers", () => {
    expect(textLinkVariants({ size: "sm" })).toContain("text-sm");
    expect(textLinkVariants({ size: "sm" })).toContain("min-h-11");
  });
});
