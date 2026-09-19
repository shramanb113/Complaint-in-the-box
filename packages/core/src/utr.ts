import type { Packet } from "./types";

/**
 * The web app generates packets on the server with `utr: UTR_TOKEN` so the
 * server never sees or stores a real UTR. The browser then swaps the token
 * for what the user types, using `applyUtr`.
 */
export const UTR_TOKEN = "[[UTR]]";

export const UTR_MISSING_EN = " (UTR not available — please locate using amount, date and time)";
export const UTR_MISSING_HI = " (UTR उपलब्ध नहीं — कृपया राशि, तिथि और समय के आधार पर खोजें)";
export const UTR_BANK_MISSING = "Not available — locate via amount/date/time";

/** The parenthesised UTR phrase used in WhatsApp/email text. */
export function utrLine(utr: string | undefined, locale: "en" | "hi"): string {
  if (utr) return ` (UTR: ${utr})`;
  return locale === "en" ? UTR_MISSING_EN : UTR_MISSING_HI;
}

/** Strips whitespace; returns undefined unless the result is 8-35 letters/digits. */
export function normalizeUtr(input: string): string | undefined {
  const compact = input.replace(/\s+/g, "");
  return /^[A-Za-z0-9]{8,35}$/.test(compact) ? compact : undefined;
}

/** Returns a new packet with UTR_TOKEN replaced by the (normalized) UTR, or by the "not available" wording. */
export function applyUtr(packet: Packet, input: string | undefined): Packet {
  const utr = input === undefined ? undefined : normalizeUtr(input);
  const tokenLine = ` (UTR: ${UTR_TOKEN})`;
  const swap = (text: string, locale: "en" | "hi"): string =>
    utr
      ? text.split(UTR_TOKEN).join(utr)
      : text.split(tokenLine).join(utrLine(undefined, locale));

  const { artifacts } = packet;
  return {
    ...packet,
    artifacts: {
      ...artifacts,
      whatsapp: {
        en: swap(artifacts.whatsapp.en, "en"),
        hi: swap(artifacts.whatsapp.hi, "hi"),
      },
      emailSubject: {
        en: swap(artifacts.emailSubject.en, "en"),
        hi: swap(artifacts.emailSubject.hi, "hi"),
      },
      emailBody: {
        en: swap(artifacts.emailBody.en, "en"),
        hi: swap(artifacts.emailBody.hi, "hi"),
      },
      bankFields: artifacts.bankFields
        ? Object.fromEntries(
            Object.entries(artifacts.bankFields).map(([key, value]) => [
              key,
              value === UTR_TOKEN ? (utr ?? UTR_BANK_MISSING) : value,
            ])
          )
        : undefined,
    },
  };
}
