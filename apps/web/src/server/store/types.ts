import type { Packet } from "@nyaypatra/core";

/**
 * How long a saved letter link works (spec §5). One constant, so retention can change in one place.
 * The text "7 days" is also written by hand in src/lib/i18n/messages/how-it-works.ts, src/lib/legal-content.ts and README.md: change them together with this constant.
 */
export const PACKET_TTL_DAYS = 7;
const DAY_MS = 86_400_000;

export function packetExpiresAt(packet: Pick<Packet, "createdAt">): Date {
  return new Date(new Date(packet.createdAt).getTime() + PACKET_TTL_DAYS * DAY_MS);
}

export interface PacketStore {
  /** Rejects if the id already exists. */
  save(packet: Packet): Promise<void>;
  /** The saved packet, or undefined when the id is unknown or the link has expired (expiresAt <= now). */
  get(id: string, now?: Date): Promise<Packet | undefined>;
  /** Deletes expired packets and returns how many. */
  deleteExpired(now?: Date): Promise<number>;
}

export const RATE_WINDOW_MS = 3_600_000;

/** Rate limits count in whole UTC hours. */
export function windowStart(now: Date): Date {
  return new Date(Math.floor(now.getTime() / RATE_WINDOW_MS) * RATE_WINDOW_MS);
}

export interface RateLimitResult {
  allowed: boolean;
  /** Attempts in the current window, including this one. */
  count: number;
  limit: number;
  /** When the current window ends. */
  resetsAt: Date;
}

export interface RateLimiter {
  /** Counts one attempt for this key in the current window (even when over the limit) and says whether it is allowed. */
  hit(key: string, now?: Date): Promise<RateLimitResult>;
  /** Deletes counters for windows that started before `olderThan`; returns how many. */
  purge(olderThan: Date): Promise<number>;
}
