"use client";

import Link from "next/link";
import { Button } from "@nyaypatra/ui";
import { shellMessages } from "@/lib/i18n/messages/shell";

/**
 * Catches any throw from a route inside the root layout (the packet route has its own, more specific
 * error.tsx). Error boundaries are Client Components and cannot await getLocale(), so this reads the
 * <html lang> attribute the root layout already sets server-side, before this boundary can ever mount.
 */
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = typeof document !== "undefined" && document.documentElement.lang === "hi" ? "hi" : "en";
  const t = shellMessages[locale].error;
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter">{t.title}</h1>
      <p className="text-lg font-medium">{t.body}</p>
      <div className="flex gap-3">
        <Button size="lg" onClick={reset}>
          {t.retry}
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/">{t.home}</Link>
        </Button>
      </div>
    </div>
  );
}
