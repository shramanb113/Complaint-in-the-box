// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
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

  // The following cases port coverage that lived in the deleted packet-plain.test.tsx, updated for
  // Task 5's tabbed layout (WhatsApp tab is default-active; Email and Portal need a tab switch).

  it("shows the WhatsApp bubbles in both languages, site language first, tagged with their own language", () => {
    const packet = samplePacket();
    const { artifacts } = applyUtr(packet, undefined);
    const { container, unmount } = render(<PacketView packet={packet} locale="hi" strings={packetMessages.hi} isNew />);
    const hiTagged = Array.from(container.querySelectorAll('[role="tabpanel"] [lang]'));
    expect(hiTagged.map((el) => el.getAttribute("lang"))).toEqual(["hi", "en"]);
    expect(hiTagged.map((el) => el.textContent)).toEqual([artifacts.whatsapp.hi, artifacts.whatsapp.en]);
    unmount();
    const english = render(<PacketView packet={packet} locale="en" strings={packetMessages.en} isNew />);
    const enTagged = Array.from(english.container.querySelectorAll('[role="tabpanel"] [lang]'));
    expect(enTagged.map((el) => el.getAttribute("lang"))).toEqual(["en", "hi"]);
    expect(enTagged.map((el) => el.textContent)).toEqual([artifacts.whatsapp.en, artifacts.whatsapp.hi]);
  });

  it.each(["en", "hi"] as const)("tags the email subject and body with the letter's language, in the %s site language", async (locale) => {
    const user = userEvent.setup();
    const packet = samplePacket();
    const { artifacts } = applyUtr(packet, undefined);
    const { container } = render(<PacketView packet={packet} locale={locale} strings={packetMessages[locale]} isNew />);
    await user.click(screen.getByRole("tab", { name: packetMessages[locale].tabLabels.email }));
    for (const lang of ["en", "hi"] as const) {
      const texts = Array.from(container.querySelectorAll(`pre[lang="${lang}"]`), (pre) => pre.textContent);
      expect(texts).toEqual([artifacts.emailSubject[lang], artifacts.emailBody[lang]]);
    }
  });

  it.each(["en", "hi"] as const)("leaves the headings and buttons in the %s site language, not the letter's", async (locale) => {
    const user = userEvent.setup();
    const { container } = render(<PacketView packet={samplePacket()} locale={locale} strings={packetMessages[locale]} isNew />);
    for (const chrome of [...screen.getAllByRole("heading"), ...screen.getAllByRole("button")]) {
      expect(chrome.closest("[lang]")?.getAttribute("lang")).toBe(locale);
    }
    await user.click(screen.getByRole("tab", { name: packetMessages[locale].tabLabels.email }));
    for (const chrome of [...screen.getAllByRole("heading"), ...screen.getAllByRole("button")]) {
      expect(chrome.closest("[lang]")?.getAttribute("lang")).toBe(locale);
    }
    expect(container.querySelector("article")?.getAttribute("lang")).toBe(locale);
  });

  it("shows the reply deadline and the expiry line when given", () => {
    render(<PacketView packet={samplePacket()} locale="en" strings={packetMessages.en} expiresLine="This link works until 27 Sep 2026." isNew />);
    expect(screen.getByText(/Reply deadline you are giving them: 27 Sep 2026/)).toBeInTheDocument();
    expect(screen.getByText("This link works until 27 Sep 2026.")).toBeInTheDocument();
  });

  it("offers a copy button for each message, across the WhatsApp and Email tabs", async () => {
    const user = userEvent.setup();
    render(<PacketView packet={samplePacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(2);
    await user.click(screen.getByRole("tab", { name: "Email + PDF" }));
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(4);
  });

  it("lists the portal answers in English and opens official links safely", async () => {
    const user = userEvent.setup();
    render(<PacketView packet={samplePacket()} locale="hi" strings={packetMessages.hi} isNew />);
    await user.click(screen.getByRole("tab", { name: packetMessages.hi.tabLabels.portal }));
    const portal = screen.getByRole("region", { name: packetMessages.hi.portal });
    expect(within(portal).getByText("Amount (INR)")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /National Consumer Helpline/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("shows the bank answers only for UPI letters", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PacketView packet={upiPacket()} locale="en" strings={packetMessages.en} isNew />);
    await user.click(screen.getByRole("tab", { name: packetMessages.en.tabLabels.portal }));
    expect(screen.getByRole("region", { name: packetMessages.en.bank })).toBeInTheDocument();
    rerender(<PacketView packet={samplePacket()} locale="en" strings={packetMessages.en} isNew />);
    expect(screen.queryByRole("region", { name: packetMessages.en.bank })).toBeNull();
  });

  it("switches to the Email tab and shows the Download PDF button", async () => {
    const user = userEvent.setup();
    render(<PacketView packet={upiPacket()} locale="en" strings={packetMessages.en} isNew />);
    await user.click(screen.getByRole("tab", { name: "Email + PDF" }));
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
  });

  it("lists the next steps in the site language", () => {
    render(<PacketView packet={samplePacket()} locale="hi" strings={packetMessages.hi} isNew />);
    const steps = screen.getByRole("region", { name: packetMessages.hi.nextSteps });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(3);
    expect(steps.textContent).toMatch(/[ऀ-ॿ]/);
  });

  // packetDeadline() returns a YMD object; stringifying it directly with a template literal produced
  // "[object Object]T23:59:59" (an Invalid Date), so past_deadline was always false. Regression coverage.
  it("reports past_deadline correctly on revisit, for both an expired and a still-open letter", () => {
    const plausible = (window.plausible = vi.fn());
    render(<PacketView packet={samplePacket("id1", new Date("2015-01-01T00:00:00Z"))} locale="en" strings={packetMessages.en} isNew={false} />);
    expect(plausible).toHaveBeenCalledWith("packet_revisited", { props: expect.objectContaining({ past_deadline: true }) });

    plausible.mockClear();
    render(<PacketView packet={samplePacket("id2", new Date(Date.now() + 400 * 86_400_000))} locale="en" strings={packetMessages.en} isNew={false} />);
    expect(plausible).toHaveBeenCalledWith("packet_revisited", { props: expect.objectContaining({ past_deadline: false }) });

    delete window.plausible;
  });
});
