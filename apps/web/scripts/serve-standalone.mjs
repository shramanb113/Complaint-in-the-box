// Copies static assets into place exactly as scripts/smoke-standalone.mjs does, then execs the
// standalone server as the foreground process — Playwright's webServer starts and stops this directly.
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const standaloneWeb = join(webRoot, ".next", "standalone", "apps", "web");
const server = join(standaloneWeb, "server.js");
if (!existsSync(server)) {
  console.error(`Standalone server not found at ${server}. Run \`npm run build -w @nyaypatra/web\` first.`);
  process.exit(1);
}

const staticDir = join(webRoot, ".next", "static");
cpSync(staticDir, join(standaloneWeb, ".next", "static"), { recursive: true, force: true });
const publicDir = join(webRoot, "public");
if (existsSync(publicDir)) cpSync(publicDir, join(standaloneWeb, "public"), { recursive: true, force: true });

const result = spawnSync(process.execPath, [server], {
  env: { ...process.env, PORT: "3458", HOSTNAME: "127.0.0.1", NODE_ENV: "production", PACKET_STORE: "memory" },
  stdio: "inherit",
});
process.exit(result.status ?? 1);
