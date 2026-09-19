import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const server = join(here, "..", ".next", "standalone", "apps", "web", "server.js");
if (!existsSync(server)) {
  console.error(`Standalone server not found at ${server}. Run \`npm run build -w @nyaypatra/web\` first.`);
  process.exit(1);
}

const port = 3457;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [server], {
  env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", NODE_ENV: "production" },
  stdio: "inherit",
});

async function waitUntilUp() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {
      // server not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("standalone server did not start within 30 seconds");
}

let failed = false;
function check(name, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed = true;
}

try {
  await waitUntilUp();
  const health = await (await fetch(`${base}/api/health`)).json();
  check("/api/health reports ok", health.status === "ok" && health.whatsappChars > 100);
  check("/ returns 200", (await fetch(`${base}/`)).status === 200);
  check("/design is hidden in production", (await fetch(`${base}/design`)).status === 404);
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  child.kill();
}
process.exit(failed ? 1 : 0);
