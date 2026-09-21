import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadCompanyCatalog } from "@nyaypatra/core";
import { InMemoryPacketStore, InMemoryRateLimiter } from "../src/server/store/memory";
import type { SubmitState } from "../src/lib/intake/result";
import { validRaw } from "./helpers/intake";

const state = vi.hoisted(() => ({ services: undefined as unknown, forwarded: "198.51.100.7" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": state.forwarded }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("@/server/services", () => ({ getServices: () => state.services }));

import { submitIntakeAction } from "../src/app/new/[category]/actions";

const idle: SubmitState = { status: "idle" };
let store: InMemoryPacketStore;

function form(templateId: string | null, raw: Partial<Record<string, string>> = {}): FormData {
  const data = new FormData();
  if (templateId !== null) data.set("templateId", templateId);
  for (const [key, value] of Object.entries(raw)) if (value !== undefined) data.set(key, value);
  return data;
}

beforeEach(() => {
  store = new InMemoryPacketStore();
  state.forwarded = "198.51.100.7";
  state.services = { store, limiter: new InMemoryRateLimiter(1), catalog: loadCompanyCatalog(), ipHashSalt: "test-salt-test-salt" };
});

describe("submitIntakeAction", () => {
  it("saves a valid form and redirects to the packet link", async () => {
    await expect(submitIntakeAction(idle, form("ecom_wrong_item", validRaw("ecom_wrong_item")))).rejects.toThrow(
      /^REDIRECT \/packet\/[0-9A-HJKMNP-TV-Z]{26}\?new=1$/
    );
  });

  it("returns the field errors for an invalid form", async () => {
    const result = await submitIntakeAction(idle, form("ecom_wrong_item", { ...validRaw("ecom_wrong_item"), amountInr: "abc" }));
    expect(result).toEqual({ status: "invalid", errors: { amountInr: "notNumber" } });
  });

  it("returns an error for a missing or unknown template, and never saves", async () => {
    expect(await submitIntakeAction(idle, form(null, validRaw("ecom_wrong_item")))).toEqual({ status: "error" });
    expect(await submitIntakeAction(idle, form("../../etc/passwd", validRaw("ecom_wrong_item")))).toEqual({ status: "error" });
    expect(await store.deleteExpired(new Date("2099-01-01"))).toBe(0);
  });

  it("reads only the known fields: a UTR or a different category in the request changes nothing", async () => {
    const data = form("ecom_wrong_item", { ...validRaw("ecom_wrong_item"), utr: "409912345678", category: "upi", id: "01HACKERAAAAAAAAAAAAAAAAAA" });
    const error = await submitIntakeAction(idle, data).then(
      () => undefined,
      (e: unknown) => e as Error
    );
    const id = /\/packet\/(\w+)\?new=1$/.exec(error?.message ?? "")?.[1];
    expect(id).toBeDefined();
    expect(id).not.toBe("01HACKERAAAAAAAAAAAAAAAAAA");
    const saved = await store.get(id as string, new Date());
    expect(saved?.intake.category).toBe("ecommerce");
    expect(JSON.stringify(saved)).not.toContain("409912345678");
  });

  it("rate-limits by the last forwarded address, so forging the first entries does not help", async () => {
    state.forwarded = "1.1.1.1, 198.51.100.7";
    await expect(submitIntakeAction(idle, form("ecom_wrong_item", validRaw("ecom_wrong_item")))).rejects.toThrow(/REDIRECT/);
    state.forwarded = "2.2.2.2, 198.51.100.7";
    expect(await submitIntakeAction(idle, form("ecom_wrong_item", validRaw("ecom_wrong_item")))).toEqual({ status: "rate_limited" });
  });
});
