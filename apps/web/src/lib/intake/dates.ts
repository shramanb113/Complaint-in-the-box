import { nowToIstYMD } from "@nyaypatra/core";

/** Today's calendar date in India (IST), as YYYY-MM-DD: the latest date a payment can have. */
export function todayIstIso(now: Date = new Date()): string {
  const { y, m, d } = nowToIstYMD(now);
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export type DateResult = { ok: true; value: string } | { ok: false; error: "required" | "badDate" };

/** A real calendar date in YYYY-MM-DD form (what a date input sends). Whether it is too old or in the future is decided elsewhere. */
export function parseIsoDate(input: string): DateResult {
  const text = input.trim();
  if (text === "") return { ok: false, error: "required" };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return { ok: false, error: "badDate" };
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? { ok: true, value: text } : { ok: false, error: "badDate" };
}
