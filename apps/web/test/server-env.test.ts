import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/server/env";

const PROD = { NODE_ENV: "production" };
const SALT = "a-long-random-salt-value";

describe("loadConfig", () => {
  it("keeps letters in memory in development when there is no database", () => {
    expect(loadConfig({})).toMatchObject({ storage: "memory", rateLimitPerHour: 10 });
    expect(loadConfig({ NODE_ENV: "development" }).ipHashSalt.length).toBeGreaterThan(10);
  });

  it("uses Postgres when DATABASE_URL is set", () => {
    expect(loadConfig({ DATABASE_URL: "postgres://u:p@h/db" })).toMatchObject({ storage: "postgres", databaseUrl: "postgres://u:p@h/db" });
  });

  it("treats empty values (as in a copied .env.example) as unset", () => {
    expect(loadConfig({ DATABASE_URL: "", PACKET_STORE: "", IP_HASH_SALT: "", RATE_LIMIT_PER_HOUR: "" })).toMatchObject({
      storage: "memory",
      rateLimitPerHour: 10,
    });
  });

  it("lets PACKET_STORE force memory even when a database is configured", () => {
    expect(loadConfig({ DATABASE_URL: "postgres://u:p@h/db", PACKET_STORE: "memory" }).storage).toBe("memory");
  });

  it("refuses PACKET_STORE=postgres without a DATABASE_URL", () => {
    expect(() => loadConfig({ PACKET_STORE: "postgres" })).toThrow(/DATABASE_URL/);
  });

  it("refuses to run in production without a database, unless memory was asked for on purpose", () => {
    expect(() => loadConfig({ ...PROD })).toThrow(/DATABASE_URL is required in production/);
    expect(loadConfig({ ...PROD, PACKET_STORE: "memory" }).storage).toBe("memory");
  });

  it("requires a real salt in production with a database", () => {
    expect(() => loadConfig({ ...PROD, DATABASE_URL: "postgres://u:p@h/db" })).toThrow(/IP_HASH_SALT/);
    expect(loadConfig({ ...PROD, DATABASE_URL: "postgres://u:p@h/db", IP_HASH_SALT: SALT }).ipHashSalt).toBe(SALT);
  });

  it("rejects a salt that is too short", () => {
    expect(() => loadConfig({ IP_HASH_SALT: "short" })).toThrow(/IP_HASH_SALT/);
  });

  it("reads the rate limit and rejects nonsense", () => {
    expect(loadConfig({ RATE_LIMIT_PER_HOUR: "25" }).rateLimitPerHour).toBe(25);
    expect(() => loadConfig({ RATE_LIMIT_PER_HOUR: "0" })).toThrow(/RATE_LIMIT_PER_HOUR/);
    expect(() => loadConfig({ RATE_LIMIT_PER_HOUR: "lots" })).toThrow(/RATE_LIMIT_PER_HOUR/);
  });

  it("never puts a secret value in an error message", () => {
    try {
      loadConfig({ DATABASE_URL: "postgres://user:hunter2@host/db", RATE_LIMIT_PER_HOUR: "lots" });
      throw new Error("expected loadConfig to throw");
    } catch (error) {
      expect(String(error)).not.toContain("hunter2");
      expect(String(error)).not.toContain("postgres://");
    }
  });
});
