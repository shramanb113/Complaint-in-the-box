import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@nyaypatra/core", "@nyaypatra/ui"],
  // npm runs workspace scripts with cwd = apps/web; tracing from the monorepo
  // root makes the standalone build include the workspace packages.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  poweredByHeader: false,
};

export default config;
