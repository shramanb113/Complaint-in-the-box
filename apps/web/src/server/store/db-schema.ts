import type { Packet } from "@nyaypatra/core";
import { index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/** Saved letters. The ULID in `id` is also the access key in the link (80 bits of randomness). */
export const packets = pgTable(
  "packets",
  {
    id: text("id").primaryKey(),
    packet: jsonb("packet").$type<Packet>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("packets_expires_at_idx").on(table.expiresAt)]
);

/** One row per hashed client address per hour. The address itself is never stored. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    ipHash: text("ip_hash").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ipHash, table.windowStart] }),
    index("rate_limits_window_start_idx").on(table.windowStart),
  ]
);
