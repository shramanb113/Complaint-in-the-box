// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { generatePacket, loadCompanyCatalog, UTR_TOKEN } from "@nyaypatra/core";
import { PacketView } from "../src/components/packet/packet-view";
import { packetMessages } from "../src/lib/i18n/messages/packet";

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
});
