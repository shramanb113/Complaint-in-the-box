import { and, eq, gt, lte, lt, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { Packet } from "@nyaypatra/core";
import * as schema from "./db-schema";
import {
  packetExpiresAt,
  RATE_WINDOW_MS,
  windowStart,
  type PacketStore,
  type RateLimiter,
  type RateLimitResult,
} from "./types";

/** Any Drizzle Postgres database: node-postgres in production, PGlite in tests. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export class PostgresPacketStore implements PacketStore {
  constructor(private readonly db: Db) {}

  async save(packet: Packet): Promise<void> {
    await this.db.insert(schema.packets).values({
      id: packet.id,
      packet,
      createdAt: new Date(packet.createdAt),
      expiresAt: packetExpiresAt(packet),
    });
  }

  async get(id: string, now: Date = new Date()): Promise<Packet | undefined> {
    const rows = await this.db
      .select({ packet: schema.packets.packet })
      .from(schema.packets)
      .where(and(eq(schema.packets.id, id), gt(schema.packets.expiresAt, now)))
      .limit(1);
    return rows[0]?.packet;
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    const rows = await this.db
      .delete(schema.packets)
      .where(lte(schema.packets.expiresAt, now))
      .returning({ id: schema.packets.id });
    return rows.length;
  }
}

export class PostgresRateLimiter implements RateLimiter {
  constructor(
    private readonly db: Db,
    private readonly limit: number
  ) {}

  async hit(key: string, now: Date = new Date()): Promise<RateLimitResult> {
    const start = windowStart(now);
    const rows = await this.db
      .insert(schema.rateLimits)
      .values({ ipHash: key, windowStart: start, count: 1 })
      .onConflictDoUpdate({
        target: [schema.rateLimits.ipHash, schema.rateLimits.windowStart],
        set: { count: sql`${schema.rateLimits.count} + 1` },
      })
      .returning({ count: schema.rateLimits.count });
    const count = rows[0]?.count ?? 1;
    return {
      allowed: count <= this.limit,
      count,
      limit: this.limit,
      resetsAt: new Date(start.getTime() + RATE_WINDOW_MS),
    };
  }

  async purge(olderThan: Date): Promise<number> {
    const rows = await this.db
      .delete(schema.rateLimits)
      .where(lt(schema.rateLimits.windowStart, olderThan))
      .returning({ ipHash: schema.rateLimits.ipHash });
    return rows.length;
  }
}
