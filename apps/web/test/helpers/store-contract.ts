import { beforeEach, describe, expect, it } from "vitest";
import { packetExpiresAt, type PacketStore, type RateLimiter } from "../../src/server/store/types";
import { SAVED_AT, samplePacket } from "./packet";

/** Behaviour every PacketStore must share. Call once per implementation. */
export function describePacketStore(name: string, make: () => Promise<PacketStore>) {
  describe(`${name}: PacketStore contract`, () => {
    let store: PacketStore;
    beforeEach(async () => {
      store = await make();
    });

    it("saves a packet and reads it back unchanged, Hindi included", async () => {
      const packet = samplePacket();
      await store.save(packet);
      expect(await store.get(packet.id, SAVED_AT)).toEqual(packet);
    });

    it("returns undefined for an unknown id", async () => {
      expect(await store.get("01K5AAAAAAAAAAAAAAAAAAAAAA", SAVED_AT)).toBeUndefined();
    });

    it("expires exactly 7 days after creation", () => {
      expect(packetExpiresAt(samplePacket()).toISOString()).toBe("2026-09-27T06:00:00.000Z");
    });

    it("keeps a packet readable until the moment it expires, then treats it as gone", async () => {
      const packet = samplePacket();
      await store.save(packet);
      const expiresAt = packetExpiresAt(packet);
      expect(await store.get(packet.id, new Date(expiresAt.getTime() - 1))).toBeDefined();
      expect(await store.get(packet.id, expiresAt)).toBeUndefined();
    });

    it("refuses to overwrite an existing id", async () => {
      const packet = samplePacket();
      await store.save(packet);
      await expect(store.save(packet)).rejects.toThrow();
    });

    it("deletes one packet on request and says whether it existed", async () => {
      const packet = samplePacket();
      const other = samplePacket("01K5NEWAAAAAAAAAAAAAAAAAAA", SAVED_AT);
      await store.save(packet);
      await store.save(other);
      expect(await store.delete(packet.id)).toBe(true);
      expect(await store.get(packet.id, SAVED_AT)).toBeUndefined();
      expect(await store.get(other.id, SAVED_AT)).toBeDefined();
      expect(await store.delete(packet.id)).toBe(false);
    });

    it("deletes only expired packets and says how many", async () => {
      const old = samplePacket("01K5OLDAAAAAAAAAAAAAAAAAAA", new Date("2026-09-01T00:00:00Z"));
      const fresh = samplePacket("01K5NEWAAAAAAAAAAAAAAAAAAA", SAVED_AT);
      await store.save(old);
      await store.save(fresh);
      expect(await store.deleteExpired(SAVED_AT)).toBe(1);
      expect(await store.get(old.id, new Date("2026-09-02T00:00:00Z"))).toBeUndefined();
      expect(await store.get(fresh.id, SAVED_AT)).toBeDefined();
      expect(await store.deleteExpired(SAVED_AT)).toBe(0);
    });

    it("does not hand out storage itself, so a caller cannot corrupt a saved letter", async () => {
      const packet = samplePacket();
      await store.save(packet);
      const first = await store.get(packet.id, SAVED_AT);
      if (!first) throw new Error("expected a packet");
      first.intake.city = "Changed";
      expect((await store.get(packet.id, SAVED_AT))?.intake.city).toBe("Pune");
    });
  });
}

/** Behaviour every RateLimiter must share. */
export function describeRateLimiter(name: string, make: (limit: number) => Promise<RateLimiter>) {
  describe(`${name}: RateLimiter contract`, () => {
    const T = new Date("2026-09-20T10:15:00Z");

    it("allows up to the limit within an hour, then blocks", async () => {
      const limiter = await make(3);
      for (let count = 1; count <= 3; count++) {
        expect(await limiter.hit("a", T)).toMatchObject({ allowed: true, count, limit: 3 });
      }
      expect(await limiter.hit("a", T)).toMatchObject({ allowed: false, count: 4, limit: 3 });
    });

    it("counts each key separately", async () => {
      const limiter = await make(1);
      expect((await limiter.hit("a", T)).allowed).toBe(true);
      expect((await limiter.hit("b", T)).allowed).toBe(true);
      expect((await limiter.hit("a", T)).allowed).toBe(false);
    });

    it("starts a fresh count in the next hour and reports when the window ends", async () => {
      const limiter = await make(1);
      const first = await limiter.hit("a", T);
      expect(first.resetsAt.toISOString()).toBe("2026-09-20T11:00:00.000Z");
      expect((await limiter.hit("a", T)).allowed).toBe(false);
      expect(await limiter.hit("a", new Date("2026-09-20T11:00:00Z"))).toMatchObject({ allowed: true, count: 1 });
    });

    it("purges counters older than the given time and says how many", async () => {
      const limiter = await make(5);
      await limiter.hit("a", new Date("2026-09-19T10:15:00Z"));
      await limiter.hit("b", T);
      const cutoff = new Date("2026-09-20T00:00:00Z");
      expect(await limiter.purge(cutoff)).toBe(1);
      expect(await limiter.purge(cutoff)).toBe(0);
      expect((await limiter.hit("b", T)).count).toBe(2);
    });
  });
}
