import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "src", "styles", "theme.css"),
  "utf-8"
);

describe("design tokens (theme.css)", () => {
  it.each([
    ["--color-cream", "#fff6e0"],
    ["--color-ink", "#111111"],
    ["--color-turmeric", "#ffc21a"],
    ["--color-wa", "#25d366"],
    ["--color-wa-dark", "#075e54"],
    ["--color-tomato", "#ff5a36"],
    ["--color-sky", "#d9e8ff"],
    ["--color-peach", "#ffd9cf"],
    ["--color-mint", "#cff5db"],
    ["--color-butter", "#ffe9a6"],
    ["--color-chat", "#dcf8c6"],
    ["--color-chat-bg", "#e7ddcf"],
  ])("defines %s as %s", (name, value) => {
    expect(css.toLowerCase()).toContain(`${name}: ${value}`);
  });

  it.each([
    "--shadow-hard-sm",
    "--shadow-hard:",
    "--shadow-hard-lg",
    "--shadow-hard-xl",
    "--radius-chip",
    "--radius-card",
    "--radius-field",
    "--font-display",
    "--font-mono",
    "--ease-pop",
    "--animate-pop",
    "--animate-wobble",
  ])("defines %s", (name) => {
    expect(css).toContain(name);
  });

  it("uses no blur in hard shadows", () => {
    const shadows = css.split("\n").filter((line) => line.includes("--shadow-hard"));
    expect(shadows.length).toBeGreaterThanOrEqual(4);
    for (const line of shadows) expect(line).toMatch(/\d+px \d+px 0 /);
  });

  it("keeps Space Mono for .font-mono inside Hindi, falling back to Mukta for Devanagari", () => {
    expect(css).toMatch(
      /\.font-mono:lang\(hi\)\s*\{[^}]*font-family:\s*var\(--font-space-mono\),\s*var\(--font-mukta\),[^;}]*;/
    );
  });

  it("keeps Baloo 2 for .font-hi-display inside Hindi", () => {
    expect(css).toMatch(
      /\.font-hi-display:lang\(hi\)\s*\{[^}]*font-family:\s*var\(--font-hi-display\)\s*;/
    );
  });

  it("respects prefers-reduced-motion", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
