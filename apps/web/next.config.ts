import path from "node:path";
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Plausible (analytics-script.tsx) is the only third-party origin this app ever talks to. Dev mode
// needs 'unsafe-eval' and a websocket allowance for React Refresh/HMR; production does not.
const CSP = [
  "default-src 'self'",
  `script-src 'self' https://plausible.io${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self' https://plausible.io${isProd ? "" : " ws://localhost:* http://localhost:*"}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@nyaypatra/core", "@nyaypatra/ui"],
  // npm runs workspace scripts with cwd = apps/web; tracing from the monorepo
  // root makes the standalone build include the workspace packages.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          // No `preload`: submitting the domain to browsers' HSTS preload list is a separate,
          // hard-to-reverse step outside this app's scope.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default config;
