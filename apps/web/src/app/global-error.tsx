"use client";

/**
 * Catches a throw from the root layout itself (font loading, generateMetadata, getLocale) — the one
 * place error.tsx cannot reach, because error.tsx renders inside the layout that just failed. This
 * replaces <html> and <body> entirely, so it cannot depend on the layout's CSS, fonts or components
 * being available and stays deliberately plain and English-only.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2.5rem 1.5rem", maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Something went wrong</h1>
        <p style={{ fontSize: "1.1rem", margin: "1rem 0" }}>
          Something went wrong on our side, not because of anything you did. Try again, or go back to the home page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ marginRight: "0.75rem", padding: "0.6rem 1.2rem", fontSize: "1rem", cursor: "pointer" }}
        >
          Try again
        </button>
        <a href="/" style={{ fontSize: "1rem" }}>
          Go to the home page
        </a>
      </body>
    </html>
  );
}
