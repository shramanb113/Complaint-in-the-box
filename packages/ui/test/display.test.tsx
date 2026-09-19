import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatBubble } from "../src/components/chat-bubble";
import { DeadlineTag } from "../src/components/deadline-tag";
import { Sticker } from "../src/components/sticker";
import { fontSizePx } from "./font-size";

describe("ChatBubble", () => {
  it("renders the letter text in a pre-wrapped mono bubble so line breaks survive", () => {
    render(<ChatBubble>{"Order OD123, paid ₹2,499.\n\nI want a full refund."}</ChatBubble>);
    const bubble = screen.getByText(/Order OD123/);
    expect(bubble.className).toContain("whitespace-pre-wrap");
    expect(bubble.className).toContain("font-mono");
    expect(bubble.className).toContain("bg-chat");
  });

  it("keeps the letter body at 15px so Hindi text stays readable (>= 14px)", () => {
    render(<ChatBubble>{"मुझे पूरा रिफंड चाहिए।"}</ChatBubble>);
    const bubble = screen.getByText(/रिफंड/);
    expect(bubble.className).toContain("text-[15px]");
    expect(fontSizePx(bubble.className)).toBeGreaterThanOrEqual(14);
  });

  it("breaks long unbroken strings (order ids, URLs) instead of overflowing the bubble", () => {
    render(<ChatBubble>{"https://example.com/" + "a".repeat(200)}</ChatBubble>);
    expect(screen.getByText(/https:\/\/example\.com/).className).toContain("wrap-break-word");
  });

  it("uses the wa-dark token, not a raw hex, for the time and ticks", () => {
    render(<ChatBubble time="10:42">Hi</ChatBubble>);
    const time = screen.getByText("✓✓ 10:42");
    expect(time.className).toContain("text-wa-dark");
    expect(time.className).not.toMatch(/\[#/);
  });

  it("shows the time with ticks only when given", () => {
    const { rerender } = render(<ChatBubble>Hi</ChatBubble>);
    expect(screen.queryByText(/✓✓/)).toBeNull();
    rerender(<ChatBubble time="10:42">Hi</ChatBubble>);
    expect(screen.getByText("✓✓ 10:42")).toBeInTheDocument();
  });
});

describe("DeadlineTag", () => {
  it("is tomato by default (urgent) and turmeric when ready", () => {
    const { rerender } = render(<DeadlineTag>Reply by 26 Sep</DeadlineTag>);
    expect(screen.getByText("Reply by 26 Sep").className).toContain("bg-tomato");
    expect(screen.getByText("Reply by 26 Sep").className).toContain("text-ink");
    expect(screen.getByText("Reply by 26 Sep").className).not.toContain("text-white");
    rerender(<DeadlineTag tone="ready">Ready ✓</DeadlineTag>);
    expect(screen.getByText("Ready ✓").className).toContain("bg-turmeric");
  });

  it("sets its text at 14px or larger so Hindi deadlines stay readable", () => {
    render(<DeadlineTag>{"26 सितंबर तक जवाब दें"}</DeadlineTag>);
    expect(fontSizePx(screen.getByText(/सितंबर/).className)).toBeGreaterThanOrEqual(14);
  });
});

describe("Sticker", () => {
  it("renders its text tilted by the given angle with the wobble animation", () => {
    render(<Sticker tilt={8}>Free. Always.</Sticker>);
    const sticker = screen.getByText("Free. Always.");
    expect(sticker.style.transform).toBe("rotate(8deg)");
    expect(sticker.className).toContain("motion-safe:animate-wobble");
    expect(sticker.className).toContain("bg-tomato");
  });

  it("uses ink text on the tomato surface for AA contrast (white would be ~3.1:1)", () => {
    render(<Sticker>Hi</Sticker>);
    const sticker = screen.getByText("Hi");
    expect(sticker.className).toContain("text-ink");
    expect(sticker.className).not.toContain("text-white");
  });

  it("defaults to a 12 degree tilt", () => {
    render(<Sticker>Hi</Sticker>);
    expect(screen.getByText("Hi").style.transform).toBe("rotate(12deg)");
  });

  it("keeps its tilt when motion is reduced: the rotation is static and only the wobble is motion-gated", () => {
    render(<Sticker tilt={8}>Free. Always.</Sticker>);
    const sticker = screen.getByText("Free. Always.");
    // The resting rotation lives in the inline style, so it survives the reduced-motion override
    // that snaps animations back to their untransformed state.
    expect(sticker.style.transform).toBe("rotate(8deg)");
    expect(sticker.style.getPropertyValue("--tilt")).toBe("8deg");
    // Every wobble class is gated behind motion-safe, so it never applies when motion is reduced.
    const wobbleClasses = sticker.className.split(/\s+/).filter((token) => token.includes("animate-wobble"));
    expect(wobbleClasses.length).toBeGreaterThan(0);
    for (const token of wobbleClasses) {
      expect(token.startsWith("motion-safe:")).toBe(true);
    }
  });
});
