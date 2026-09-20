// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { generatePacket, loadCompanyCatalog, UTR_TOKEN, type Intake } from "@nyaypatra/core";
import { PacketPlain } from "../src/components/packet/packet-plain";
import { packetMessages } from "../src/lib/i18n/messages/packet";
import { SAVED_AT, samplePacket } from "./helpers/packet";

const upiIntake: Intake = {
  category: "upi",
  templateId: "upi_double_debit",
  locale: "both",
  platform: "gpay",
  companyName: "Sharma Electricians",
  amountInr: 1200,
  paidOn: "2026-09-13",
  utr: UTR_TOKEN,
  whatHappened: "The money was taken twice from my account for one payment.",
  desiredRemedy: "reverse_failed_upi",
  deadlineDays: 7,
};

describe("PacketPlain", () => {
  it("shows the letter in both languages, the site language first", () => {
    render(<PacketPlain packet={samplePacket()} locale="hi" strings={packetMessages.hi} />);
    const sections = screen.getAllByRole("region");
    const langs = sections.map((section) => section.getAttribute("lang"));
    expect(langs.slice(0, 2)).toEqual(["hi", "en"]);
  });

  it("tags each language block so the right font and screen-reader voice apply", () => {
    const { container } = render(<PacketPlain packet={samplePacket()} locale="en" strings={packetMessages.en} />);
    expect(container.querySelector('section[lang="en"]')).not.toBeNull();
    expect(container.querySelector('section[lang="hi"]')).not.toBeNull();
  });

  it("never shows the raw UTR token: a UPI letter reads 'not available' until the browser fills it", () => {
    const packet = generatePacket(upiIntake, loadCompanyCatalog(), SAVED_AT);
    expect(JSON.stringify(packet)).toContain(UTR_TOKEN);
    const { container } = render(<PacketPlain packet={packet} locale="en" strings={packetMessages.en} />);
    expect(container.textContent).not.toContain(UTR_TOKEN);
    expect(container.textContent).toContain("UTR not available");
  });

  it("shows the reply deadline and the expiry line when given", () => {
    render(<PacketPlain packet={samplePacket()} locale="en" strings={packetMessages.en} expiresLine="This link works until 27 Sep 2026." />);
    expect(screen.getByText(/Reply deadline you are giving them: 27 Sep 2026/)).toBeInTheDocument();
    expect(screen.getByText("This link works until 27 Sep 2026.")).toBeInTheDocument();
  });

  it("offers a copy button for each message", () => {
    render(<PacketPlain packet={samplePacket()} locale="en" strings={packetMessages.en} />);
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(6);
  });

  it("lists the portal answers in English and opens official links safely", () => {
    render(<PacketPlain packet={samplePacket()} locale="hi" strings={packetMessages.hi} />);
    const portal = screen.getByRole("region", { name: packetMessages.hi.portal });
    expect(within(portal).getByText("Amount (INR)")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /National Consumer Helpline/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("shows the bank answers only for UPI letters", () => {
    const upi = generatePacket(upiIntake, loadCompanyCatalog(), SAVED_AT);
    const { rerender } = render(<PacketPlain packet={upi} locale="en" strings={packetMessages.en} />);
    expect(screen.getByRole("region", { name: packetMessages.en.bank })).toBeInTheDocument();
    rerender(<PacketPlain packet={samplePacket()} locale="en" strings={packetMessages.en} />);
    expect(screen.queryByRole("region", { name: packetMessages.en.bank })).toBeNull();
  });

  it("lists the next steps in the site language", () => {
    render(<PacketPlain packet={samplePacket()} locale="hi" strings={packetMessages.hi} />);
    const steps = screen.getByRole("region", { name: packetMessages.hi.nextSteps });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(3);
    expect(steps.textContent).toMatch(/[ऀ-ॿ]/);
  });
});
