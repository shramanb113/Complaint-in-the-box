"use client";

import { Button } from "@nyaypatra/ui";

/**
 * Next's error boundary for this route: catches the throw in page.tsx's store.get() wrapper. That
 * wrapper already logged the real cause server-side (log-failure.ts); this only shows a branded page.
 * English-only: error boundaries are Client Components and cannot await getLocale().
 */
export default function PacketError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter">This letter could not load</h1>
      <p className="text-lg font-medium">Something went wrong on our side, not because of anything you did. Try again in a moment.</p>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
