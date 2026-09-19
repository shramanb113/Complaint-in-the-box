import { describe, it, expect, vi, afterEach } from "vitest";
import { copyToClipboard } from "../src/lib/clipboard";

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}
function setExecCommand(value: unknown) {
  Object.defineProperty(document, "execCommand", { value, configurable: true });
}

afterEach(() => {
  setClipboard(undefined);
  setExecCommand(undefined);
});

describe("copyToClipboard", () => {
  it("uses the async Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to execCommand when the Clipboard API rejects", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    const exec = vi.fn(() => true);
    setExecCommand(exec);
    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull(); // temp element cleaned up
  });

  it("resolves false when every method fails", async () => {
    setClipboard(undefined);
    setExecCommand(vi.fn(() => false));
    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });
});
