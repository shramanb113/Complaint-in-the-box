import "server-only";

import { createHash } from "node:crypto";

/**
 * The client address as our own infrastructure saw it. X-Forwarded-For is a comma-separated list that
 * grows by one entry per proxy hop, each proxy appending the address it saw the request come from; the
 * client-controlled entries (if any) always come first. `trustedHops` is how many of our own proxies
 * sit between the internet and this server (TRUST_PROXY_HOPS, default 1) — the real client is that many
 * entries from the right. Getting this wrong in either direction is a real bug: too few hops trusts a
 * client-forged address, too many collapses every visitor onto the same (internal) address and makes
 * the per-IP rate limit useless.
 */
export function clientIp(headers: { get(name: string): string | null }, trustedHops: number = 1): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const picked = entries.length > 0 ? entries[Math.max(0, entries.length - trustedHops)] : undefined;
    if (picked) return picked;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Salted SHA-256: enough to count requests per address without keeping the address. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
