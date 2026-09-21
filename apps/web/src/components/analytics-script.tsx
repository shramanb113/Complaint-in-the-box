import Script from "next/script";

/** Loads Plausible only when a domain is configured (spec §10). Unset (the default) means no analytics script ships at all. */
export function AnalyticsScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return <Script defer data-domain={domain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />;
}
