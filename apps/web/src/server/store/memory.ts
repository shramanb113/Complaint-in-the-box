import type { Packet } from "@nyaypatra/core";
import {
  packetExpiresAt,
  RATE_WINDOW_MS,
  windowStart,
  type PacketStore,
  type RateLimiter,
  type RateLimitResult,
} from "./types";

/** For development and tests. Everything is lost when the process restarts. */
export class InMemoryPacketStore implements PacketStore {
  private readonly rows = new Map<string, { packet: Packet; expiresAt: Date }>();

  async save(packet: Packet): Promise<void> {
    if (this.rows.has(packet.id)) throw new Error("duplicate packet id");
    this.rows.set(packet.id, { packet: structuredClone(packet), expiresAt: packetExpiresAt(packet) });
  }

  async get(id: string, now: Date = new Date()): Promise<Packet | undefined> {
    const row = this.rows.get(id);
    if (!row || row.expiresAt.getTime() <= now.getTime()) return undefined;
    return structuredClone(row.packet);
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    let removed = 0;
    for (const [id, row] of this.rows) {
      if (row.expiresAt.getTime() <= now.getTime()) {
        this.rows.delete(id);
        removed++;
      }
    }
    return removed;
  }
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(private readonly limit: number) {}

  async hit(key: string, now: Date = new Date()): Promise<RateLimitResult> {
    const start = windowStart(now);
    const id = `${key}|${start.getTime()}`;
    const row = this.windows.get(id) ?? { start: start.getTime(), count: 0 };
    row.count += 1;
    this.windows.set(id, row);
    return {
      allowed: row.count <= this.limit,
      count: row.count,
      limit: this.limit,
      resetsAt: new Date(start.getTime() + RATE_WINDOW_MS),
    };
  }

  async purge(olderThan: Date): Promise<number> {
    let removed = 0;
    for (const [id, row] of this.windows) {
      if (row.start < olderThan.getTime()) {
        this.windows.delete(id);
        removed++;
      }
    }
    return removed;
  }
}
