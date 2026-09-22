import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { generatePacket, loadCompanyCatalog } from "@nyaypatra/core";
import { runCleanup } from "../src/server/cleanup";
import { InMemoryPacketStore, InMemoryRateLimiter } from "../src/server/store/memory";
import { POST } from "../src/app/api/cleanup/route";

const catalog = loadCompanyCatalog();

function packetAt(id: string, createdAt: string) {
  const packet = generatePacket(
    {
      category: "ecommerce",
      templateId: "ecom_wrong_item",
      locale: "en",
      platform: "flipkart",
      amountInr: 100,
      paidOn: "2026-01-01",
      whatHappened: "test",
      desiredRemedy: "full_refund_original_mode",
      deadlineDays: 7,
    },
    catalog,
    new Date(createdAt)
  );
  return { ...packet, id, createdAt };
}

describe("runCleanup", () => {
  it("deletes expired packets and purges old rate-limit windows, and counts both", async () => {
    const store = new InMemoryPacketStore();
    const limiter = new InMemoryRateLimiter(10);
    const now = new Date("2026-09-21T12:00:00Z");
    await store.save(packetAt("expired", "2026-09-01T00:00:00Z"));
    await store.save(packetAt("fresh", "2026-09-21T00:00:00Z"));
    await limiter.hit("old-ip", new Date("2026-09-01T00:00:00Z"));
    await limiter.hit("recent-ip", now);

    const result = await runCleanup({ store, limiter }, now);

    expect(result.deletedPackets).toBe(1);
    expect(result.purgedRateLimits).toBe(1);
    expect(await store.get("expired", now)).toBeUndefined();
    expect(await store.get("fresh", now)).toBeDefined();
  });
});

describe("POST /api/cleanup", () => {
  const SECRET = "test-secret-well-over-sixteen-chars";
  const originalSecret = process.env.CRON_SECRET;
  const originalStore = process.env.PACKET_STORE;
  const originalIpSalt = process.env.IP_HASH_SALT;
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    process.env.PACKET_STORE = "memory";
    process.env.IP_HASH_SALT = "x".repeat(16);
  });
  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
    process.env.PACKET_STORE = originalStore;
    process.env.IP_HASH_SALT = originalIpSalt;
  });

  it("rejects a request with no or the wrong bearer token", async () => {
    const response = await POST(new Request("http://x/api/cleanup", { method: "POST" }));
    expect(response.status).toBe(403);
    const wrong = await POST(
      new Request("http://x/api/cleanup", { method: "POST", headers: { authorization: "Bearer nope-nope-nope" } })
    );
    expect(wrong.status).toBe(403);
  });

  it("runs cleanup for a request with the right bearer token", async () => {
    const response = await POST(
      new Request("http://x/api/cleanup", { method: "POST", headers: { authorization: `Bearer ${SECRET}` } })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.deletedPackets).toBe("number");
  });

  it("refuses every request when CRON_SECRET is unset (safe default deny)", async () => {
    delete process.env.CRON_SECRET;
    const response = await POST(
      new Request("http://x/api/cleanup", { method: "POST", headers: { authorization: "Bearer anything-long-enough" } })
    );
    expect(response.status).toBe(403);
  });

  it("refuses a CRON_SECRET shorter than 16 characters, even when it matches exactly", async () => {
    process.env.CRON_SECRET = "short-secret";
    const response = await POST(
      new Request("http://x/api/cleanup", { method: "POST", headers: { authorization: "Bearer short-secret" } })
    );
    expect(response.status).toBe(403);
  });
});
