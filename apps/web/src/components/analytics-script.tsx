import Script from "next/script";

/**
 * Loads Plausible only when a domain is configured (spec §10). Unset (the default) means no analytics
 * script ships at all.
 *
 * `/packet/*` is excluded from Plausible's automatic pageview capture: the packet URL's ULID is the
 * only credential that page needs, and Plausible's autocapture sends `location.href` (the ULID
 * included) as the pageview event. Manual custom events — `packet_generated`, `packet_revisited`,
 * `packet_expired_view` (see components/packet/packet-view.tsx) — are unaffected by the exclusion and
 * keep reporting packet activity without ever passing the URL.
 */
export function AnalyticsScript({ nonce }: { nonce: string }) {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      data-exclude="/packet/**"
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
