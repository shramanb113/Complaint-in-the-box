import path from "node:path";
import type { NextConfig } from "next";

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
          // Content-Security-Policy is set per-request by middleware.ts (it needs a fresh nonce every
          // request so Next's own injected hydration scripts can run under a strict script-src).
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
