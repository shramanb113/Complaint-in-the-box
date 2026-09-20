// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TemplateId } from "@nyaypatra/core";
import { IntakeForm } from "../src/components/intake/intake-form";
import { intakeMessages } from "../src/lib/i18n/messages/intake";
import { packetMessages } from "../src/lib/i18n/messages/packet";
import { shellMessages } from "../src/lib/i18n/messages/shell";
import type { SubmitState } from "../src/lib/intake/result";
import { samplePacket } from "./helpers/packet";

const TODAY = "2026-09-20";

function setup(
  templateId: TemplateId = "ecom_wrong_item",
  locale: "en" | "hi" = "en",
  action = vi.fn(async (): Promise<SubmitState> => ({ status: "idle" })),
  today: string = TODAY
) {
  const utils = render(
    <IntakeForm
      templateId={templateId}
      locale={locale}
      strings={intakeMessages[locale]}
      packetStrings={packetMessages[locale]}
      disclaimer={shellMessages[locale].footer.disclaimer}
      today={today}
      action={action}
    />
  );
  return { ...utils, action, user: userEvent.setup() };
}

async function fillValidWrongItem(user: ReturnType<typeof userEvent.setup>, paidOn = "2024-05-10") {
  await user.click(screen.getByRole("radio", { name: "Flipkart" }));
  await user.type(screen.getByLabelText("Amount you paid"), "2,499");
  fireEvent.change(screen.getByLabelText("Date you paid"), { target: { value: paidOn } });
  await user.type(screen.getByLabelText("What happened?"), "The item never reached me even after the promised date.");
}

describe("IntakeForm: fields", () => {
  it("shows platform chips and hides the company name until 'Other' is chosen", async () => {
    const { user } = setup();
    expect(screen.getByRole("radio", { name: "Flipkart" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Company or shop name")).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Other" }));
    expect(screen.getByLabelText("Company or shop name")).toBeInTheDocument();
  });

  it("asks a UPI payer who they paid, and never asks for an order id", () => {
    setup("upi_double_debit");
    expect(screen.getByLabelText(/Who did you pay/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Order ID/)).toBeNull();
    expect(screen.getByRole("radio", { name: "Google Pay" })).toBeInTheDocument();
  });

  it("shows the delivery date only where the letter uses it, and the listed price only for hidden fees", () => {
    const first = setup("ecom_wrong_item");
    expect(screen.getByLabelText(/Date it arrived/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Price shown before you paid")).toBeNull();
    first.unmount();
    setup("fee_drip_pricing");
    expect(screen.getByLabelText("Price shown before you paid")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Date it arrived/)).toBeNull();
  });

  it("lets a wrong-item complainant choose the remedy, and only states it when there is no choice", () => {
    const first = setup("ecom_wrong_item");
    expect(screen.getByRole("radio", { name: "Pick up the item and refund me" })).toBeChecked();
    first.unmount();
    setup("ecom_not_delivered");
    expect(screen.getByText("What you are asking for")).toBeInTheDocument();
    expect(screen.getByText("Full refund to the original payment method")).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "A replacement item" })).toBeNull();
  });

  it("starts with a 7-day deadline", () => {
    setup();
    expect(screen.getByRole("radio", { name: "7 days" })).toBeChecked();
  });

  it("stops date pickers at today (IST) and before 2016", () => {
    setup();
    const date = screen.getByLabelText("Date you paid");
    expect(date).toHaveAttribute("max", TODAY);
    expect(date).toHaveAttribute("min", "2016-01-01");
  });

  it("counts the characters of the narrative", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("What happened?"), "hello");
    expect(screen.getByText("5 of 400 characters")).toBeInTheDocument();
  });

  it("puts the disclaimer directly above the submit button", () => {
    setup();
    const disclaimer = screen.getByText(shellMessages.en.footer.disclaimer);
    const button = screen.getByRole("button", { name: "Make my letter" });
    expect(disclaimer.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders in Hindi", () => {
    setup("upi_double_debit", "hi");
    expect(screen.getByRole("button", { name: "मेरा पत्र बनाएँ" })).toBeInTheDocument();
    expect(screen.getByLabelText(/आपने किसे भुगतान किया/)).toBeInTheDocument();
  });
});

describe("IntakeForm: validation before sending", () => {
  it("shows every problem at once, sends nothing, and focuses the first problem", async () => {
    const { user, action } = setup();
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getAllByText("This is needed.").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("Please check the fields marked below and try again.")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Flipkart" }));
    expect(screen.getByLabelText("Amount you paid")).toHaveAttribute("aria-invalid", "true");
  });

  it("clears a field's error as soon as it is edited", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    const amount = screen.getByLabelText("Amount you paid");
    expect(amount).toHaveAttribute("aria-invalid", "true");
    await user.type(amount, "2");
    expect(amount).not.toHaveAttribute("aria-invalid");
  });

  it("judges dates against the server's 'today', not the device clock: a date after it is rejected", async () => {
    const { user, action } = setup("ecom_wrong_item", "en", undefined, "2024-05-09");
    await fillValidWrongItem(user, "2024-05-10");
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    expect(screen.getByText("This date is in the future. Pick today or an earlier date.")).toBeInTheDocument();
    expect(screen.getByLabelText("Date you paid")).toHaveAttribute("aria-invalid", "true");
    expect(action).not.toHaveBeenCalled();
  });

  it("judges dates against the server's 'today', not the device clock: a date up to it is accepted", async () => {
    const { user, action } = setup("ecom_wrong_item", "en", undefined, "2099-01-02");
    await fillValidWrongItem(user, "2099-01-01");
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("This date is in the future. Pick today or an earlier date.")).toBeNull();
  });

  it("explains a rejected amount in plain words", async () => {
    const { user } = setup();
    await fillValidWrongItem(user);
    const amount = screen.getByLabelText("Amount you paid");
    await user.clear(amount);
    await user.type(amount, "499.50");
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    expect(screen.getByText("Please round to the nearest rupee, for example 499.")).toBeInTheDocument();
  });
});

describe("IntakeForm: sending", () => {
  it("sends the template and the known fields once, and never a UTR", async () => {
    const { user, action } = setup();
    await fillValidWrongItem(user);
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = (action.mock.calls[0] as unknown as [SubmitState, FormData])[1];
    expect(data.get("templateId")).toBe("ecom_wrong_item");
    expect(data.get("platform")).toBe("flipkart");
    expect(data.get("amountInr")).toBe("2,499");
    expect(data.get("paidOn")).toBe("2024-05-10");
    expect(data.get("deadlineDays")).toBe("7");
    expect(data.has("utr")).toBe(false);
  });

  it("disables the button while the letter is being made, so a double tap cannot send twice", async () => {
    // React runs async actions one after another across the whole page, so a promise that never settles would
    // leave every later test waiting behind it. Settle it at the end of the test instead.
    let finish: (state: SubmitState) => void = () => {};
    const action = vi.fn(() => new Promise<SubmitState>((resolve) => (finish = resolve)));
    const { user } = setup("ecom_wrong_item", "en", action);
    await fillValidWrongItem(user);
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    const busy = await screen.findByRole("button", { name: "Making your letter…" });
    expect(busy).toBeDisabled();
    await user.click(busy);
    expect(action).toHaveBeenCalledTimes(1);
    finish({ status: "idle" });
    expect(await screen.findByRole("button", { name: "Make my letter" })).toBeEnabled();
  });

  it("shows errors the server found in the same places", async () => {
    const action = vi.fn(async (): Promise<SubmitState> => ({ status: "invalid", errors: { amountInr: "tooBig" } }));
    const { user } = setup("ecom_wrong_item", "en", action);
    await fillValidWrongItem(user);
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    expect(await screen.findByText("That amount is too large. Please check it.")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount you paid")).toHaveAttribute("aria-invalid", "true");
  });

  it("tells the person when they have made too many letters", async () => {
    const action = vi.fn(async (): Promise<SubmitState> => ({ status: "rate_limited" }));
    const { user } = setup("ecom_wrong_item", "en", action);
    await fillValidWrongItem(user);
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    expect(await screen.findByText(intakeMessages.en.form.rateLimited)).toBeInTheDocument();
  });

  it("says nothing was saved when something breaks on our side", async () => {
    const action = vi.fn(async (): Promise<SubmitState> => ({ status: "error" }));
    const { user } = setup("ecom_wrong_item", "en", action);
    await fillValidWrongItem(user);
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    expect(await screen.findByText(intakeMessages.en.form.serverError)).toBeInTheDocument();
  });

  it("shows the letter anyway, with a warning, when saving failed (spec §5.4)", async () => {
    const packet = samplePacket();
    const action = vi.fn(async (): Promise<SubmitState> => ({ status: "unsaved", packet }));
    const { user } = setup("ecom_wrong_item", "en", action);
    await fillValidWrongItem(user);
    await user.click(screen.getByRole("button", { name: "Make my letter" }));
    expect(await screen.findByText(packetMessages.en.unsaved.title)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copy" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Make my letter" })).toBeNull();
  });
});
