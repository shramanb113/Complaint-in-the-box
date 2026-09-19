import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CopyButton } from "../src/components/copy-button";

// Own clipboard mock (no user-event clipboard stub) so the test controls success/failure exactly.
const writeText = vi.fn();

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  writeText.mockReset();
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  Object.defineProperty(document, "execCommand", { value: vi.fn(() => false), configurable: true });
});
afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
  Object.defineProperty(document, "execCommand", { value: undefined, configurable: true });
});

describe("CopyButton", () => {
  it("copies the text, shows the done label, then reverts after the reset delay", async () => {
    writeText.mockResolvedValue(undefined);
    const onCopied = vi.fn();
    render(<CopyButton text="Order OD123" idleLabel="Copy message" doneLabel="Copied ✓" onCopied={onCopied} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));

    expect(await screen.findByRole("button", { name: "Copied ✓" })).toBeInTheDocument();
    expect(screen.getByRole("button").className).toContain("bg-turmeric");
    expect(writeText).toHaveBeenCalledWith("Order OD123");
    expect(onCopied).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
  });

  it("calls onFailed and keeps the idle label when copying is impossible", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const onFailed = vi.fn();
    render(<CopyButton text="x" idleLabel="Copy message" doneLabel="Copied ✓" onFailed={onFailed} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));

    await waitFor(() => expect(onFailed).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
  });
});
