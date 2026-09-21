"use client";

import { Button } from "@nyaypatra/ui";
import { packetMessages } from "@/lib/i18n/messages/packet";

/**
 * Next's error boundary for this route: catches the throw in page.tsx's store.get() wrapper. That
 * wrapper already logged the real cause server-side (log-failure.ts); this only shows a branded page.
 * Error boundaries are Client Components and cannot await getLocale(), so this reads the <html lang>
 * attribute the root layout already sets server-side, before this boundary can ever mount.
 */
export default function PacketError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = typeof document !== "undefined" && document.documentElement.lang === "hi" ? "hi" : "en";
  const t = packetMessages[locale].loadError;
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter">{t.title}</h1>
      <p className="text-lg font-medium">{t.body}</p>
      <Button size="lg" onClick={reset}>
        {t.retry}
      </Button>
    </div>
  );
}
