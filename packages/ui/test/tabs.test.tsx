import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/components/tabs";
import { fontSizePx } from "./font-size";

function Demo() {
  return (
    <Tabs defaultValue="whatsapp">
      <TabsList aria-label="Letter format">
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="email">Email + PDF</TabsTrigger>
        <TabsTrigger value="portal">Portal</TabsTrigger>
      </TabsList>
      <TabsContent value="whatsapp">WhatsApp text</TabsContent>
      <TabsContent value="email">Email text</TabsContent>
      <TabsContent value="portal">Portal fields</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default tab's content and marks its trigger active", () => {
    render(<Demo />);
    expect(screen.getByText("WhatsApp text")).toBeVisible();
    expect(screen.queryByText("Email text")).toBeNull();
    expect(screen.getByRole("tab", { name: "WhatsApp" })).toHaveAttribute("data-state", "active");
  });

  it("switches content when another tab is clicked", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("tab", { name: "Email + PDF" }));
    expect(screen.getByText("Email text")).toBeVisible();
    expect(screen.queryByText("WhatsApp text")).toBeNull();
    expect(screen.getByRole("tab", { name: "Email + PDF" })).toHaveAttribute("data-state", "active");
  });

  it("gives every trigger a 44px minimum tap target and the ink border look", () => {
    render(<Demo />);
    const trigger = screen.getByRole("tab", { name: "Portal" });
    expect(trigger.className).toContain("min-h-11");
    expect(screen.getByRole("tablist").className).toContain("border-ink");
  });

  it("does not clip the 3px focus ring: the list has no overflow clipping and the end triggers carry the corner radius", () => {
    render(<Demo />);
    const list = screen.getByRole("tablist");
    expect(list.className).not.toMatch(/(^|\s)overflow-/);
    const first = screen.getByRole("tab", { name: "WhatsApp" });
    expect(first.className).toContain("first:rounded-l-");
    expect(first.className).toContain("last:rounded-r-");
    // The global 3px green focus-visible ring must not be switched off on the trigger.
    for (const trigger of screen.getAllByRole("tab")) {
      expect(trigger.className).not.toMatch(/outline-none|outline-0|focus(-visible)?:outline-hidden/);
    }
  });

  it("sets trigger text at 14px or larger so Hindi tab labels stay readable", () => {
    render(<Demo />);
    for (const trigger of screen.getAllByRole("tab")) {
      expect(fontSizePx(trigger.className)).toBeGreaterThanOrEqual(14);
    }
  });
});
