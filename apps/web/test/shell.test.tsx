// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("../src/lib/i18n/actions", () => ({ setLocale: vi.fn() }));

import { SiteFooter } from "../src/components/shell/site-footer";
import { SiteHeader } from "../src/components/shell/site-header";
import { shellMessages } from "../src/lib/i18n/messages/shell";

describe("SiteHeader", () => {
  it("links the brand to the home page and shows the language toggle", () => {
    render(<SiteHeader locale="en" />);
    expect(screen.getByRole("link", { name: "Nyay Patra" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });

  it("links to How it works in the current language", () => {
    render(<SiteHeader locale="hi" />);
    expect(screen.getByRole("link", { name: shellMessages.hi.nav.howItWorks })).toHaveAttribute("href", "/how-it-works");
    expect(screen.getByRole("group", { name: shellMessages.hi.languageLabel })).toBeInTheDocument();
  });
});

describe("SiteFooter", () => {
  it("shows the fixed disclaimer and the non-affiliation line in the current language", () => {
    const { rerender } = render(<SiteFooter locale="en" />);
    expect(screen.getByText(shellMessages.en.footer.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(shellMessages.en.footer.notAffiliated)).toBeInTheDocument();
    rerender(<SiteFooter locale="hi" />);
    expect(screen.getByText(shellMessages.hi.footer.disclaimer)).toBeInTheDocument();
    expect(screen.queryByText(shellMessages.en.footer.disclaimer)).toBeNull();
  });

  it("has a labelled navigation with the four site links", () => {
    render(<SiteFooter locale="en" />);
    const nav = screen.getByRole("navigation", { name: shellMessages.en.footer.navLabel });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/how-it-works",
      "/legal/disclaimer",
      "/legal/privacy",
      "/legal/terms",
    ]);
    for (const link of links) expect(link.className).toContain("min-h-11");
  });
});

describe("shellMessages", () => {
  it("keeps the disclaimer text fixed as written in PRD F6 (English)", () => {
    expect(shellMessages.en.footer.disclaimer).toBe(
      "This tool drafts text from facts you entered. It is not a lawyer, not the government, and does not file cases for you. Check names, amounts, and dates before you send."
    );
  });
});
