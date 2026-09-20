/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { ALL_MESSAGES } from "../src/lib/i18n/messages";

const modules = import.meta.glob("../src/lib/i18n/messages/*.ts", { eager: true }) as Record<string, Record<string, unknown>>;

const isBilingual = (value: unknown): boolean =>
  typeof value === "object" && value !== null && "en" in value && "hi" in value;

describe("messages registry", () => {
  it("registers every messages file, so the parity test cannot skip one", () => {
    const registered = new Set<unknown>(Object.values(ALL_MESSAGES));
    const files = Object.keys(modules).filter((path) => !path.endsWith("/index.ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const path of files) {
      const blocks = Object.values(modules[path]).filter(isBilingual);
      expect(blocks.length, `${path} exports no bilingual block`).toBeGreaterThan(0);
      for (const block of blocks) expect(registered.has(block), `${path} is missing from ALL_MESSAGES`).toBe(true);
    }
  });
});
