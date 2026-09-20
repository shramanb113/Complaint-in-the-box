import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const standaloneWeb = join(webRoot, ".next", "standalone", "apps", "web");
const server = join(standaloneWeb, "server.js");
if (!existsSync(server)) {
  console.error(`Standalone server not found at ${server}. Run \`npm run build -w @nyaypatra/web\` first.`);
  process.exit(1);
}

// Next's standalone output omits .next/static and public/. A real deploy copies
// them next to server.js, so do the same here to test the deployable shape.
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

const port = 3457;
const base = `http://127.0.0.1:${port}`;

// Do not pass against somebody else's server that is already on the port.
let portInUse = false;
try {
  await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2000) });
  portInUse = true;
} catch {
  // nothing is listening (or nothing answers within 2s), which is what we want
}
if (portInUse) {
  console.error(`Port ${port} is already in use by another server. Stop it and run the smoke test again.`);
  process.exit(1);
}

const child = spawn(process.execPath, [server], {
  env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", NODE_ENV: "production" },
  stdio: "inherit",
});
let exited = null;
child.once("exit", (code, signal) => {
  exited = { code, signal };
});

function exitMessage() {
  return `standalone server exited early (code ${exited.code}, signal ${exited.signal})`;
}

async function waitUntilUp() {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (exited) throw new Error(exitMessage());
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
  if (exited) throw new Error(exitMessage());
  const health = await (await fetch(`${base}/api/health`)).json();
  check("/api/health reports ok", health.status === "ok" && health.whatsappChars > 100);
  const home = await fetch(`${base}/`);
  check("/ returns 200", home.status === 200);
  check("/design is hidden in production", (await fetch(`${base}/design`)).status === 404);
  for (const path of [
    "/how-it-works",
    "/legal/disclaimer",
    "/legal/privacy",
    "/legal/terms",
    "/new/ecommerce",
    "/new/hidden_fee?template=fee_drip_pricing",
    "/new/ecommerce?template=upi_double_debit",
  ]) {
    check(`${path} returns 200`, (await fetch(`${base}${path}`)).status === 200);
  }
  check("/new/bogus returns 404", (await fetch(`${base}/new/bogus`)).status === 404);
  check("an unknown page returns 404", (await fetch(`${base}/no-such-page`)).status === 404);

  // The site language comes from the np_lang cookie and must be right in the first HTML.
  const htmlLang = async (cookie) => {
    const response = await fetch(`${base}/`, cookie ? { headers: { cookie } } : undefined);
    return /<html[^>]*\blang="([^"]+)"/.exec(await response.text())?.[1];
  };
  check("/ is English by default", (await htmlLang()) === "en");
  check("the np_lang=hi cookie serves Hindi", (await htmlLang("np_lang=hi")) === "hi");
  check("a junk np_lang cookie falls back to English", (await htmlLang("np_lang=zz")) === "en");
  const hindiHome = await (await fetch(`${base}/`, { headers: { cookie: "np_lang=hi" } })).text();
  check("the Hindi home page has Hindi text and the picker anchor", /ऐसी शिकायत/.test(hindiHome) && hindiHome.includes('id="start"'));

  // Tolerate attribute order and a ?dpl=... query string: find each stylesheet <link>, then its href.
  const stylesheetTags = (await home.text()).match(/<link\b[^>]*>/g)?.filter((tag) => /\brel="stylesheet"/.test(tag)) ?? [];
  const cssHref = stylesheetTags
    .map((tag) => /\bhref="([^"]+)"/.exec(tag)?.[1])
    .find((href) => href?.startsWith("/_next/static/"));
  let cssOk = false;
  if (cssHref) {
    const css = await fetch(`${base}${cssHref}`);
    cssOk = css.status === 200 && (css.headers.get("content-type") ?? "").includes("text/css");
  }
  check("stylesheet referenced by / is served", cssOk);
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  child.kill();
}
process.exit(failed ? 1 : 0);
