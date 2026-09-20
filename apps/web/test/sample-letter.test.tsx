// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SampleLetter } from "../src/components/landing/sample-letter";

const whatsapp = { en: "Order OD1234 was wrong. I want a refund.", hi: "ऑर्डर OD1234 ग़लत था। मुझे रिफंड चाहिए।" };
const labels = {
  sample: "Sample: wrong item delivered",
  deadline: "Reply by 26 Sep 2026 · 7 days",
  tablist: "Letter language",
  caption: "Made-up order details. Your letter uses your own.",
};

describe("SampleLetter", () => {
  it("opens on the tab that matches the site language", () => {
    const { rerender } = render(<SampleLetter locale="en" whatsapp={whatsapp} labels={labels} />);
    expect(screen.getByRole("tab", { name: "English" })).toHaveAttribute("data-state", "active");
    expect(screen.getByText(whatsapp.en)).toBeVisible();
    rerender(<SampleLetter locale="hi" whatsapp={whatsapp} labels={labels} />);
    expect(screen.getByRole("tab", { name: "हिन्दी" })).toHaveAttribute("data-state", "active");
    expect(screen.getByText(whatsapp.hi)).toBeVisible();
  });

  it("shows the labels it is given and the deadline tag", () => {
    render(<SampleLetter locale="en" whatsapp={whatsapp} labels={labels} />);
    expect(screen.getByText(labels.sample)).toBeInTheDocument();
    expect(screen.getByText(labels.deadline)).toBeInTheDocument();
    expect(screen.getByText(labels.caption)).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: labels.tablist })).toBeInTheDocument();
  });

  it("tags each letter with its own language and offers a copy button in that language", async () => {
    const user = userEvent.setup();
    render(<SampleLetter locale="en" whatsapp={whatsapp} labels={labels} />);
    expect(screen.getByText(whatsapp.en).closest("[lang]")).toHaveAttribute("lang", "en");
    expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "हिन्दी" }));
    expect(screen.getByText(whatsapp.hi).closest("[lang]")).toHaveAttribute("lang", "hi");
    expect(screen.getByRole("button", { name: "संदेश कॉपी करें" })).toBeInTheDocument();
  });
});
