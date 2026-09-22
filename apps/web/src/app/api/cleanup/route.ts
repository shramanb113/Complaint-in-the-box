import { timingSafeEqual, createHash } from "node:crypto";
import { runCleanup } from "@/server/cleanup";
import { clientIp, hashIp } from "@/server/ip";
import { logFailure } from "@/server/log-failure";
import { getServices } from "@/server/services";

export const dynamic = "force-dynamic";

/** SHA-256 first, so both sides of the compare are always 32 bytes — a length mismatch would otherwise
 * let `timingSafeEqual` reject early and leak the real secret's length through response timing. */
function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  const provided = header.startsWith(prefix) ? header.slice(prefix.length) : header;
  return timingSafeEqual(sha256(provided), sha256(secret));
}

/** Protected by CRON_SECRET (spec §5.5). Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically. */
export async function POST(request: Request) {
  const services = getServices();
  const ip = clientIp(request.headers, services.trustProxyHops);

  // Reuses the configured per-hour limit (RATE_LIMIT_PER_HOUR) under a separate key namespace, so a
  // guessed secret does not get unlimited tries but also never shares budget with real form submitters.
  try {
    const hit = await services.limiter.hit(`cron-auth:${hashIp(ip, services.ipHashSalt)}`);
    if (!hit.allowed) return Response.json({ error: "unauthorized" }, { status: 403 });
  } catch (error) {
    // A broken counter must not lock out the real scheduler (mirrors submit-intake's ruling R6).
    logFailure("cron auth limiter unavailable, allowing the attempt", error);
  }

  // Read fresh on every request, not cached alongside the rest of the config: this is the one setting
  // an operator might rotate without restarting the process. A secret under 16 characters is treated as
  // misconfigured (not just "weak") and rejected the same as a missing one — it is short enough to be
  // worth guessing even with the attempt limit above.
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    if (secret) logFailure("CRON_SECRET is set but shorter than 16 characters; refusing to use it", new Error("weak secret"));
    return Response.json({ error: "unauthorized" }, { status: 403 });
  }
  if (!isAuthorized(request, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 403 });
  }
  try {
    const result = await runCleanup(services);
    return Response.json(result);
  } catch (error) {
    logFailure("cleanup failed", error);
    return Response.json({ error: "cleanup failed" }, { status: 500 });
  }
}
