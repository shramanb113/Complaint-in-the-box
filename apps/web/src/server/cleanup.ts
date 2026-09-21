import "server-only";

import type { PacketStore, RateLimiter } from "./store/types";
import { RATE_WINDOW_MS } from "./store/types";

export interface CleanupDeps {
  store: PacketStore;
  limiter: RateLimiter;
}

export interface CleanupResult {
  deletedPackets: number;
  purgedRateLimits: number;
}

/**
 * Deletes expired packets and old rate-limit windows (spec §5.5). "Old" means a window that started
 * before two windows ago — the current and the immediately previous window might still matter to a
 * caller mid-hour, everything before that is safe to drop.
 */
export async function runCleanup(deps: CleanupDeps, now: Date = new Date()): Promise<CleanupResult> {
  const deletedPackets = await deps.store.deleteExpired(now);
  const purgedRateLimits = await deps.limiter.purge(new Date(now.getTime() - RATE_WINDOW_MS * 2));
  return { deletedPackets, purgedRateLimits };
}
