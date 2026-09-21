// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { applyUtr, generatePacket, loadCompanyCatalog, UTR_TOKEN } from "@nyaypatra/core";
import { PacketView } from "../src/components/packet/packet-view";
import { packetMessages } from "../src/lib/i18n/messages/packet";
import { samplePacket } from "./helpers/packet";

const catalog = loadCompanyCatalog();

function upiPacket() {
  return generatePacket(
    {
      category: "upi",
      templateId: "upi_double_debit",
      locale: "en",
      platform: "gpay",
      utr: UTR_TOKEN,
      amountInr: 500,
      paidOn: "2026-01-01",
      whatHappened: "Charged twice for one payment.",
      desiredRemedy: "reverse_failed_upi",
      deadlineDays: 7,
    },
    catalog
  );
}

describe("PacketView", () => {
  it("shows the UTR box only for UPI packets, and substitutes what is typed into it live", async () => {
    const user = userEvent.setup();
    render(<PacketView packet={upiPacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(screen.getByLabelText("Your UTR (optional)")).toBeInTheDocument();
    expect(screen.getAllByText(/UTR not available/i).length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText("Your UTR (optional)"), "402912345678");
    expect(screen.queryByText(/UTR not available/i)).toBeNull();
    expect(screen.getAllByText(/402912345678/).length).toBeGreaterThan(0);
  });

  it("never renders the raw [[UTR]] token", () => {
    render(<PacketView packet={upiPacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(document.body.textContent).not.toContain(UTR_TOKEN);
  });

  it("has no UTR box for a non-UPI packet", () => {
    const packet = generatePacket(
      {
        category: "ecommerce",
        templateId: "ecom_wrong_item",
        locale: "en",
        platform: "flipkart",
        amountInr: 999,
        paidOn: "2026-01-01",
        whatHappened: "Wrong item.",
        desiredRemedy: "full_refund_original_mode",
        deadlineDays: 7,
      },
      catalog
    );
    render(<PacketView packet={packet} locale="en" strings={packetMessages.en} isNew />);
    expect(screen.queryByLabelText("Your UTR (optional)")).toBeNull();
  });

  // The following cases port coverage that lived in the deleted packet-plain.test.tsx (superseded
  // claim was wrong for these behaviors — they are unchanged in PacketView's flat, pre-Task-5 layout).

  it("shows the letter in both languages, the site language first", () => {
    const { container, unmount } = render(<PacketView packet={samplePacket()} locale="hi" strings={packetMessages.hi} isNew />);
    expect(Array.from(container.querySelectorAll("pre"), (pre) => pre.getAttribute("lang"))).toEqual(["hi", "hi", "hi", "en", "en", "en"]);
    unmount();
    const english = render(<PacketView packet={samplePacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(Array.from(english.container.querySelectorAll("pre"), (pre) => pre.getAttribute("lang"))).toEqual(["en", "en", "en", "hi", "hi", "hi"]);
  });

  it.each(["en", "hi"] as const)("tags only the letter text with the letter's language, in the %s site language", (locale) => {
    const packet = samplePacket();
    const { artifacts } = applyUtr(packet, undefined);
    const { container } = render(<PacketView packet={packet} locale={locale} strings={packetMessages[locale]} isNew />);
    for (const lang of ["en", "hi"] as const) {
      const texts = Array.from(container.querySelectorAll(`pre[lang="${lang}"]`), (pre) => pre.textContent);
      expect(texts).toEqual([artifacts.whatsapp[lang], artifacts.emailSubject[lang], artifacts.emailBody[lang]]);
    }
  });

  it.each(["en", "hi"] as const)("leaves the headings, labels and buttons in the %s site language, not the letter's", (locale) => {
    const { container } = render(<PacketView packet={samplePacket()} locale={locale} strings={packetMessages[locale]} isNew />);
    const blocks = [packetMessages[locale].language.en, packetMessages[locale].language.hi].map((name) => screen.getByRole("region", { name }));
    for (const block of blocks) {
      expect(block.hasAttribute("lang")).toBe(false);
      for (const tagged of Array.from(block.querySelectorAll("[lang]"))) expect(tagged.tagName).toBe("PRE");
      for (const chrome of [...within(block).getAllByRole("heading"), ...within(block).getAllByRole("button")]) {
        expect(chrome.closest("[lang]")?.getAttribute("lang")).toBe(locale);
      }
    }
    expect(container.querySelector("article")?.getAttribute("lang")).toBe(locale);
  });

  it("shows the reply deadline and the expiry line when given", () => {
    render(<PacketView packet={samplePacket()} locale="en" strings={packetMessages.en} expiresLine="This link works until 27 Sep 2026." isNew />);
    expect(screen.getByText(/Reply deadline you are giving them: 27 Sep 2026/)).toBeInTheDocument();
    expect(screen.getByText("This link works until 27 Sep 2026.")).toBeInTheDocument();
  });

  it("offers a copy button for each message", () => {
    render(<PacketView packet={samplePacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(6);
  });

  it("lists the portal answers in English and opens official links safely", () => {
    render(<PacketView packet={samplePacket()} locale="hi" strings={packetMessages.hi} isNew />);
    const portal = screen.getByRole("region", { name: packetMessages.hi.portal });
    expect(within(portal).getByText("Amount (INR)")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /National Consumer Helpline/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("shows the bank answers only for UPI letters", () => {
    const { rerender } = render(<PacketView packet={upiPacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(screen.getByRole("region", { name: packetMessages.en.bank })).toBeInTheDocument();
    rerender(<PacketView packet={samplePacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(screen.queryByRole("region", { name: packetMessages.en.bank })).toBeNull();
  });

  it("lists the next steps in the site language", () => {
    render(<PacketView packet={samplePacket()} locale="hi" strings={packetMessages.hi} isNew />);
    const steps = screen.getByRole("region", { name: packetMessages.hi.nextSteps });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(3);
    expect(steps.textContent).toMatch(/[ऀ-ॿ]/);
  });
});
