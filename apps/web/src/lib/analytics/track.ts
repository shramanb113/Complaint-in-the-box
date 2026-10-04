/**
 * Every event this app ever fires (spec §10, §12.2). `share_clicked` is not here yet — there is no
 * share button to fire it from until the distribution workstream builds one (ruling R3).
 */
export type AnalyticsEvent =
  | "landing_view"
  | "category_selected"
  | "form_started"
  | "form_completed"
  | "packet_generated"
  | "packet_revisited"
  | "packet_expired_view"
  | "copy_clicked"
  | "pdf_downloaded"
  | "whatsapp_opened"
  | "email_opened"
  | "portal_opened"
  | "utr_entered"
  | "reminder_downloaded"
  | "outcome_link_clicked"
  | "filing_checked"
  | "filing_kit_printed";

export type AnalyticsProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: AnalyticsProps }) => void;
  }
}

/**
 * Cookieless, provider-swappable (spec §10, D5: no vendor lock-in). Sends to `window.plausible` when
 * AnalyticsScript has loaded it (NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set); otherwise a no-op in production,
 * or a console line in development so events are visible while building with no provider configured.
 * Never pass the UTR or any letter text as a prop — this file has no way to enforce that, callers must not.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible === "function") {
    window.plausible(event, props ? { props } : undefined);
    return;
  }
  if (process.env.NODE_ENV !== "production") console.debug("[track]", event, props ?? {});
}
