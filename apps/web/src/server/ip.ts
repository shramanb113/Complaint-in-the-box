import "server-only";

import { createHash } from "node:crypto";

/**
 * The client address as our own proxy saw it: the LAST X-Forwarded-For entry (the leftmost entries
 * can be forged by the client), then x-real-ip, then "unknown". With more than one proxy in front
 * this needs a hop count; that is a Milestone 4 deployment concern.
 */
export function clientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const last = forwarded
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .at(-1);
    if (last) return last;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Salted SHA-256: enough to count requests per address without keeping the address. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
