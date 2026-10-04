import { afterEach, describe, expect, it, vi } from "vitest";
import { loadCompanyCatalog, TemplateIdSchema, UTR_TOKEN } from "@nyaypatra/core";
import { submitIntake, type SubmitDeps } from "../src/server/submit-intake";
import { InMemoryPacketStore, InMemoryRateLimiter } from "../src/server/store/memory";
import type { PacketStore, RateLimiter } from "../src/server/store/types";
import { NOW, validRaw } from "./helpers/intake";

const SALT = "test-salt-test-salt";

function deps(overrides: Partial<SubmitDeps> = {}): SubmitDeps {
  return {
    store: new InMemoryPacketStore(),
    limiter: new InMemoryRateLimiter(10),
    catalog: loadCompanyCatalog(),
    ipHashSalt: SALT,
    ...overrides,
  };
}

const run = (d: SubmitDeps, id: Parameters<typeof validRaw>[0], overrides = {}, ip = "203.0.113.9") =>
  submitIntake(d, { templateId: id, raw: validRaw(id, overrides), ip, now: NOW });

afterEach(() => vi.restoreAllMocks());

describe("submitIntake: the happy path", () => {
  it.each(TemplateIdSchema.options)("%s: validates, generates, saves and returns the id", async (id) => {
    const d = deps();
    const result = await run(d, id);
    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;
    const packet = await d.store.get(result.id, NOW);
    expect(packet?.intake.templateId).toBe(id);
    expect(packet?.createdAt).toBe(NOW.toISOString());
    expect(packet?.artifacts.whatsapp.en.length).toBeGreaterThan(50);
  });
});

describe("submitIntake: the UTR never reaches the server", () => {
  it("leaves the token in a UPI letter for the browser to fill, and stores no number", async () => {
    const d = deps();
    const sneaky = { ...validRaw("upi_double_debit"), utr: "409912345678" } as never;
    const result = await submitIntake(d, { templateId: "upi_double_debit", raw: sneaky, ip: "1.1.1.1", now: NOW });
    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;
    const stored = JSON.stringify(await d.store.get(result.id, NOW));
    expect(stored).toContain(UTR_TOKEN);
    expect(stored).not.toContain("409912345678");
  });

  it("puts no token in letters that have no UTR", async () => {
    const d = deps();
    const result = await run(d, "ecom_wrong_item");
    if (result.status !== "saved") throw new Error("expected saved");
    expect(JSON.stringify(await d.store.get(result.id, NOW))).not.toContain(UTR_TOKEN);
  });

  it("refuses the reserved marker typed into free text", async () => {
    const result = await run(deps(), "ecom_wrong_item", { whatHappened: `It went wrong ${UTR_TOKEN} twice over` });
    expect(result).toEqual({ status: "invalid", errors: { whatHappened: "reservedText" } });
  });
});

describe("submitIntake: validation", () => {
  it("returns the field errors and does not touch the limiter or the store", async () => {
    const hits: string[] = [];
    const limiter: RateLimiter = { hit: async (key) => (hits.push(key), { allowed: true, count: 1, limit: 10, resetsAt: NOW }), purge: async () => 0 };
    const store = new InMemoryPacketStore();
    const save = vi.spyOn(store, "save");
    const result = await run(deps({ limiter, store }), "ecom_wrong_item", { amountInr: "abc", whatHappened: "short" });
    expect(result).toEqual({ status: "invalid", errors: { amountInr: "notNumber", whatHappened: "tooShort" } });
    expect(hits).toHaveLength(0);
    expect(save).not.toHaveBeenCalled();
  });
});

describe("submitIntake: rate limiting", () => {
  it("blocks the request after the limit, per address", async () => {
    const d = deps({ limiter: new InMemoryRateLimiter(2) });
    expect((await run(d, "ecom_wrong_item")).status).toBe("saved");
    expect((await run(d, "ecom_wrong_item")).status).toBe("saved");
    expect(await run(d, "ecom_wrong_item")).toEqual({ status: "rate_limited" });
    expect((await run(d, "ecom_wrong_item", {}, "198.51.100.1")).status).toBe("saved");
  });

  it("does not count forms that fail validation", async () => {
    const d = deps({ limiter: new InMemoryRateLimiter(2) });
    for (let i = 0; i < 5; i++) expect((await run(d, "ecom_wrong_item", { amountInr: "" })).status).toBe("invalid");
    expect((await run(d, "ecom_wrong_item")).status).toBe("saved");
  });

  it("gives the limiter a salted hash, never the address", async () => {
    const keys: string[] = [];
    const limiter: RateLimiter = { hit: async (key) => (keys.push(key), { allowed: true, count: 1, limit: 10, resetsAt: NOW }), purge: async () => 0 };
    await run(deps({ limiter }), "ecom_wrong_item", {}, "203.0.113.9");
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(keys[0]).not.toContain("203.0.113.9");
  });

  it("lets the request through if the limiter itself is down, and logs only a message", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const limiter: RateLimiter = { hit: async () => { throw new Error("db down"); }, purge: async () => 0 };
    expect((await run(deps({ limiter }), "ecom_wrong_item")).status).toBe("saved");
    expect(String(error.mock.calls)).toContain("db down");
    const logged = String(error.mock.calls);
    expect(logged).not.toContain("203.0.113.9");
    expect(logged).not.toContain("OD123456");
  });
});

describe("submitIntake: failures", () => {
  it("still returns the generated letter when saving fails (spec §5.4)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const store: PacketStore = { save: async () => { throw new Error("connection refused"); }, get: async () => undefined, delete: async () => false, deleteExpired: async () => 0 };
    const result = await run(deps({ store }), "ecom_wrong_item");
    expect(result.status).toBe("unsaved");
    if (result.status !== "unsaved") return;
    expect(result.packet.artifacts.whatsapp.en).toContain("OD123456");
    expect(String(error.mock.calls)).toContain("connection refused");
    expect(String(error.mock.calls)).not.toContain("OD123456");
  });

  it("logs the underlying cause, never a Drizzle-style message that carries the bound letter", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const drizzleShaped = Object.assign(
      new Error("Failed query: insert into packets (id, body) values ($1, $2)\nparams: 01ABC,OD123456 The item never reached me even after the promised date passed. Pune Asha"),
      { cause: new Error("connection refused") }
    );
    const store: PacketStore = { save: async () => { throw drizzleShaped; }, get: async () => undefined, delete: async () => false, deleteExpired: async () => 0 };
    const result = await run(deps({ store }), "ecom_wrong_item");
    expect(result.status).toBe("unsaved");
    const logged = String(error.mock.calls);
    expect(logged).toContain("connection refused");
    expect(logged).not.toContain("OD123456");
    expect(logged).not.toContain("never reached me");
    expect(logged).not.toContain("params");
  });

  it("logs only the wrapper's name when it has a cause that is not an Error, never its message", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapped = Object.assign(
      new Error("Failed query: insert into packets (id, body) values ($1, $2)\nparams: 01ABC,OD123456 The item never reached me even after the promised date passed. Pune Asha"),
      { cause: "connection refused (a string, not an Error)" }
    );
    const store: PacketStore = { save: async () => { throw wrapped; }, get: async () => undefined, delete: async () => false, deleteExpired: async () => 0 };
    expect((await run(deps({ store }), "ecom_wrong_item")).status).toBe("unsaved");
    const logged = String(error.mock.calls);
    expect(logged).toContain("could not save the letter: Error");
    expect(logged).not.toContain("OD123456");
    expect(logged).not.toContain("never reached me");
    expect(logged).not.toContain("params");
    expect(logged).not.toContain("Failed query");
  });

  it("logs a plain error without a cause by its own message", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const store: PacketStore = { save: async () => { throw new Error("disk full"); }, get: async () => undefined, delete: async () => false, deleteExpired: async () => 0 };
    expect((await run(deps({ store }), "ecom_wrong_item")).status).toBe("unsaved");
    expect(String(error.mock.calls)).toContain("disk full");
  });

  it("returns a plain error, and stores nothing, when the letter cannot be generated", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = new InMemoryPacketStore();
    const save = vi.spyOn(store, "save");
    const catalog = new Proxy({}, { get: () => { throw new Error("catalog broke"); } });
    expect(await run(deps({ store, catalog }), "ecom_wrong_item")).toEqual({ status: "error" });
    expect(save).not.toHaveBeenCalled();
  });
});
