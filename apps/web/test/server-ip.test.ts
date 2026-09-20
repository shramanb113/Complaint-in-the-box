import { describe, it, expect } from "vitest";
import { clientIp, hashIp } from "../src/server/ip";

const headers = (init: Record<string, string>) => new Headers(init);

describe("clientIp", () => {
  it("uses the last X-Forwarded-For entry, the one our own proxy added", () => {
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("cannot be dodged by forging the first entries", () => {
    const a = clientIp(headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.9" }));
    const b = clientIp(headers({ "x-forwarded-for": "8.8.8.8, 7.7.7.7, 203.0.113.9" }));
    expect(a).toBe(b);
  });

  it("ignores blank entries", () => {
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.9, " }))).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip, then to 'unknown'", () => {
    expect(clientIp(headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIp(headers({}))).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("is a stable 64-character hex digest that does not contain the address", () => {
    const hash = hashIp("203.0.113.9", "salt-salt-salt-salt");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashIp("203.0.113.9", "salt-salt-salt-salt"));
    expect(hash).not.toContain("203");
  });

  it("changes with the salt and with the address", () => {
    expect(hashIp("203.0.113.9", "salt-one-salt-one")).not.toBe(hashIp("203.0.113.9", "salt-two-salt-two"));
    expect(hashIp("203.0.113.9", "salt-one-salt-one")).not.toBe(hashIp("203.0.113.10", "salt-one-salt-one"));
  });
});
