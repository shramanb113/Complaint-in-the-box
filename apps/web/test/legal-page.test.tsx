// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalPage } from "../src/components/legal/legal-page";
import { LEGAL } from "../src/lib/legal-content";
import { shellMessages } from "../src/lib/i18n/messages/shell";

describe("LegalPage", () => {
  it("shows the title, the date and every section heading", () => {
    render(<LegalPage doc={LEGAL.privacy} locale="en" />);
    expect(screen.getByRole("heading", { level: 1, name: LEGAL.privacy.title })).toBeInTheDocument();
    expect(screen.getByText(`Last updated ${LEGAL.privacy.updated}`)).toBeInTheDocument();
    for (const section of LEGAL.privacy.sections) {
      expect(screen.getByRole("heading", { level: 2, name: section.heading })).toBeInTheDocument();
    }
  });

  it("marks the document as English and shows a Hindi notice only for Hindi readers", () => {
    const { container, rerender } = render(<LegalPage doc={LEGAL.terms} locale="en" />);
    expect(container.querySelector("article")).toHaveAttribute("lang", "en");
    expect(screen.queryByText(shellMessages.hi.englishOnly)).toBeNull();
    rerender(<LegalPage doc={LEGAL.terms} locale="hi" />);
    const notice = screen.getByText(shellMessages.hi.englishOnly);
    expect(notice).toHaveAttribute("lang", "hi");
  });

  it("shows a contact line only when an address is configured", () => {
    const { rerender } = render(<LegalPage doc={LEGAL.privacy} locale="en" />);
    expect(screen.queryByRole("link", { name: /@/ })).toBeNull();
    rerender(<LegalPage doc={LEGAL.privacy} locale="en" contactEmail="help@example.org" />);
    expect(screen.getByRole("link", { name: "help@example.org" })).toHaveAttribute("href", "mailto:help@example.org");
  });

  it("renders extra content, such as the bilingual disclaimer, above the sections", () => {
    render(
      <LegalPage doc={LEGAL.disclaimer} locale="en">
        <p>EXTRA BLOCK</p>
      </LegalPage>
    );
    expect(screen.getByText("EXTRA BLOCK")).toBeInTheDocument();
  });
});
