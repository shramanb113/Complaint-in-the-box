// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilingReady } from "../src/components/packet/filing-ready";
import { filingMessages } from "../src/lib/i18n/messages/filing";
import { samplePacket } from "./helpers/packet";

afterEach(() => localStorage.clear());

async function fill(user: ReturnType<typeof userEvent.setup>, el: HTMLElement, text: string) {
  await user.click(el);
  await user.paste(text);
}

function setup() {
  const packet = samplePacket();
  render(
    <FilingReady packet={packet} locale="en" strings={filingMessages.en} copy={{ idle: "Copy", done: "Copied" }} onPrintKit={() => {}} />,
  );
  return { packet, user: userEvent.setup() };
}

describe("FilingReady", () => {
  it("lists blockers and shows no filing output until the facts are complete", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: filingMessages.en.check }));
    expect(screen.getByText(filingMessages.en.fixThese)).toBeInTheDocument();
    expect(screen.queryByText(filingMessages.en.nchTitle)).toBeNull();
  });

  it("produces NCH answers and the e-Jagriti kit once complete, and keeps personal details off the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { user, packet } = setup();
    await fill(user, screen.getByLabelText(filingMessages.en.fields.registeredOffice), "Alyssa, Bengaluru 560103");
    await fill(user, screen.getByLabelText(filingMessages.en.fields.fullName), "Asha Verma");
    await fill(user, screen.getByLabelText(filingMessages.en.fields.addressLine), "12 MG Road");
    await user.clear(screen.getByLabelText(filingMessages.en.fields.city));
    await fill(user, screen.getByLabelText(filingMessages.en.fields.city), "Pune");
    await user.clear(screen.getByLabelText(filingMessages.en.fields.state));
    await fill(user, screen.getByLabelText(filingMessages.en.fields.state), "Maharashtra");
    await fill(user, screen.getByLabelText(filingMessages.en.fields.pincode), "411001");
    await fill(user, screen.getByLabelText(filingMessages.en.fields.mobile), "9876543210");
    await fill(user, screen.getByLabelText(filingMessages.en.fields.email), "asha@example.com");
    expect(screen.getByText(filingMessages.en.readyTitle)).toBeInTheDocument();
    expect(screen.getByText(filingMessages.en.nchTitle)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/daakhil/i);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(`np:filing:${packet.id}`)).toContain("Asha Verma");
  }, 30000);
});
