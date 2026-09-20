import { generatePacket, UTR_TOKEN, type CompanyCatalog, type Intake, type Packet, type TemplateId } from "@nyaypatra/core";
import type { RawIntake } from "@/lib/intake/fields";
import type { SubmitResult } from "@/lib/intake/result";
import { validateIntakeForm } from "@/lib/intake/validate";
import { hashIp } from "./ip";
import type { PacketStore, RateLimiter } from "./store/types";

export interface SubmitDeps {
  store: PacketStore;
  limiter: RateLimiter;
  catalog: CompanyCatalog;
  ipHashSalt: string;
}

export interface SubmitInput {
  templateId: TemplateId;
  raw: Partial<RawIntake>;
  ip: string;
  now?: Date;
}

/**
 * Logs what went wrong, never what the person wrote (ruling R12). Drizzle wraps a driver error in one
 * whose message is "Failed query: <sql> params: <the bound values>" (the whole letter, for a save),
 * so when there is a cause we log only that: the driver's own error carries no bound values.
 */
function logFailure(what: string, error: unknown): void {
  if (!(error instanceof Error)) {
    console.error(`${what}: unknown error`);
    return;
  }
  const shown = error.cause instanceof Error ? error.cause : error;
  console.error(`${what}: ${shown.name}: ${shown.message}`);
}

/**
 * Spec §5 steps 1-2: validate again, rate-limit, generate with the UTR left as a token, save.
 * Nothing here ever sees a real UTR: the form has no such field, and the token is added here.
 */
export async function submitIntake(deps: SubmitDeps, input: SubmitInput): Promise<SubmitResult> {
  const now = input.now ?? new Date();

  const validated = validateIntakeForm(input.templateId, input.raw, now);
  if (!validated.ok) return { status: "invalid", errors: validated.errors };

  // Only requests that pass validation count, so typos do not use up the hourly quota.
  try {
    const hit = await deps.limiter.hit(hashIp(input.ip, deps.ipHashSalt), now);
    if (!hit.allowed) return { status: "rate_limited" };
  } catch (error) {
    // A broken counter must not block honest people (ruling R6).
    logFailure("rate limiter unavailable, allowing the request", error);
  }

  let packet: Packet;
  try {
    const intake: Intake = validated.intake.category === "upi" ? { ...validated.intake, utr: UTR_TOKEN } : validated.intake;
    packet = generatePacket(intake, deps.catalog, now);
  } catch (error) {
    logFailure("could not generate the letter", error);
    return { status: "error" };
  }

  try {
    await deps.store.save(packet);
    return { status: "saved", id: packet.id };
  } catch (error) {
    logFailure("could not save the letter", error);
    return { status: "unsaved", packet };
  }
}
