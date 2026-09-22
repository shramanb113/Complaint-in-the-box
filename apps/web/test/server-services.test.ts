import { afterEach, describe, expect, it, vi } from "vitest";
import { createServices, getServices } from "../src/server/services";
import { samplePacket, SAVED_AT } from "./helpers/packet";

const HOLDER = Symbol.for("nyaypatra.services");
const forget = () => {
  delete (globalThis as unknown as Record<symbol, unknown>)[HOLDER];
};

afterEach(() => {
  vi.unstubAllEnvs();
  forget();
});

describe("createServices", () => {
  it("builds working in-memory services with the company catalog", async () => {
    const services = createServices({ storage: "memory", ipHashSalt: "x".repeat(16), rateLimitPerHour: 3, trustProxyHops: 1 });
    const packet = samplePacket();
    await services.store.save(packet);
    expect(await services.store.get(packet.id, SAVED_AT)).toEqual(packet);
    expect((await services.limiter.hit("k")).limit).toBe(3);
    expect(services.catalog.flipkart?.legalName).toContain("Flipkart");
  });
});

describe("getServices", () => {
  it("builds once per process and reuses the same services", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");
    expect(getServices()).toBe(getServices());
  });

  it("reads the environment when first used, and refuses production without a database", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("PACKET_STORE", "");
    expect(() => getServices()).toThrow(/DATABASE_URL is required in production/);
  });
});
