// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../src/lib/i18n/actions", () => ({ setLocale: vi.fn() }));

import { LanguageToggle } from "../src/components/shell/language-toggle";

describe("LanguageToggle", () => {
  it("is a labelled group with one submit button per language", () => {
    render(<LanguageToggle locale="en" label="Language" />);
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    const english = screen.getByRole("button", { name: "English" });
    const hindi = screen.getByRole("button", { name: "हिन्दी" });
    expect(english).toHaveAttribute("type", "submit");
    expect(english).toHaveAttribute("name", "locale");
    expect(english).toHaveAttribute("value", "en");
    expect(hindi).toHaveAttribute("name", "locale");
    expect(hindi).toHaveAttribute("value", "hi");
  });

  it("marks the current language as pressed", () => {
    const { rerender } = render(<LanguageToggle locale="en" label="Language" />);
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "हिन्दी" })).toHaveAttribute("aria-pressed", "false");
    rerender(<LanguageToggle locale="hi" label="भाषा" />);
    expect(screen.getByRole("button", { name: "हिन्दी" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: "भाषा" })).toBeInTheDocument();
  });

  it("tags each button with its own language so the right font is used on any page", () => {
    render(<LanguageToggle locale="hi" label="भाषा" />);
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("lang", "en");
    expect(screen.getByRole("button", { name: "हिन्दी" })).toHaveAttribute("lang", "hi");
  });

  it("keeps a 44px minimum tap target", () => {
    render(<LanguageToggle locale="en" label="Language" />);
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("min-h-11");
      expect(button.className).toContain("min-w-11");
    }
  });
});
