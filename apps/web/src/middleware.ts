import { NextResponse, type NextRequest } from "next/server";

/**
 * Next's App Router injects inline <script> tags to stream RSC/hydration data to the client; a strict
 * script-src with no 'unsafe-inline' blocks those and silently breaks hydration (the form then falls
 * back to a plain, unintercepted native submission). A per-request nonce is the supported way to keep
 * script-src strict without 'unsafe-inline' — Next reads the nonce off this same header and applies it
 * to its own injected scripts automatically; any of our own <Script> tags must pass it explicitly.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isProd = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isProd ? " 'strict-dynamic'" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' https://plausible.io${isProd ? "" : " ws://localhost:* http://localhost:*"}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Skip static assets — they never need a CSP header and excluding them keeps this cheap on every request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
