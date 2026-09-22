// Next's standalone output omits .next/static and public/ (see scripts/smoke-standalone.mjs).
// `npm start` needs the same copy step production deploys rely on, then execs the real server
// process with whatever PORT/HOSTNAME/etc. the host has set — no env overrides here.
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const standaloneWeb = join(webRoot, ".next", "standalone", "apps", "web");
const server = join(standaloneWeb, "server.js");
if (!existsSync(server)) {
  console.error(`Standalone server not found at ${server}. Run \`npm run build -w @nyaypatra/web\` first.`);
  process.exit(1);
}

const staticDir = join(webRoot, ".next", "static");
if (!existsSync(staticDir)) {
  console.error(`Static assets not found at ${staticDir}. Run \`npm run build -w @nyaypatra/web\` first.`);
  process.exit(1);
}
cpSync(staticDir, join(standaloneWeb, ".next", "static"), { recursive: true, force: true });
const publicDir = join(webRoot, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, join(standaloneWeb, "public"), { recursive: true, force: true });
}

await import(pathToFileURL(server).href);
