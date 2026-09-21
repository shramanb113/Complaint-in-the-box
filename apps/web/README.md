# @nyaypatra/web

The Next.js 16 app, built as a standalone server. These are the facts a Dockerfile or host needs.

Build with the working directory set to `apps/web`, for example `npm run build -w @nyaypatra/web`. `next.config.ts` computes `outputFileTracingRoot` from `process.cwd()`, so building from any other directory produces a standalone output without the workspace packages.

Run the built server with `node .next/standalone/apps/web/server.js`, which is what `npm start -w @nyaypatra/web` runs. Do not use `next start`: Next warns that it does not work with `output: "standalone"`. The server reads `PORT` and `HOSTNAME`. Copy `.next/static` and `public/` into place first (below), or use `npm run smoke -w @nyaypatra/web`, which does it for you.

The standalone output does not include `.next/static` or `public/`. A deploy must copy both next to the standalone `server.js`, that is into `.next/standalone/apps/web/.next/static` and `.next/standalone/apps/web/public`. Without them the pages are served unstyled.

The `/design` gallery is hidden by default and returns 404 in production. Set `NEXT_PUBLIC_SHOW_DESIGN=1` at build time, not run time, to expose it.

`noindex` is set per-page via metadata (`/packet/[id]` and `/design` each opt out of indexing); a `robots.txt`/sitemap are not yet built — the public pages currently rely on the metadata-based noindex/index split above being sufficient for launch.

Do not add `"type": "module"` to `apps/web/package.json`. The standalone build copies that file next to a CommonJS `server.js`, which would then fail to load.

Every page is rendered per request, because the layout reads the `np_lang` language cookie (Next opts a route into dynamic rendering when it reads cookies). The cookie is set by a Server Action from the header's language toggle, is `HttpOnly`, lasts a year, and only accepts `en` or `hi`. The legal pages read an optional `CONTACT_EMAIL` environment variable **at run time** and show a contact line only when it is set.

Routes: `/`, `/how-it-works`, `/new/[category]` (the situation list, or the intake form when `?template=` names one), `/packet/[id]` (the tabbed WhatsApp/Email+PDF/Portal packet page for a saved letter), `/legal/disclaimer`, `/legal/privacy`, `/legal/terms`, `/api/health`, and the hidden `/design`.

`npm run smoke -w @nyaypatra/web` starts the built standalone server on port 3457, copies `.next/static` and `public/` into place as a deploy would, and checks the health endpoint, the home page, every public page, the situation list (as plain links, no JavaScript needed), that the intake form is in the server-rendered page in English and in Hindi (with the `np_lang=hi` cookie), the two `/packet/<id>` 404 shapes (an unknown well-formed id shows the friendly "expired" message; a malformed id is a plain 404), the other 404s, that the language cookie switches `<html lang>` and the Hindi text, the hidden `/design` page and that the stylesheet is served. It runs with `PACKET_STORE=memory`, so it never needs a database.

## Configuration and storage

Letters are saved for 7 days behind a random link. Storage is chosen by environment (see `.env.example`):

- `DATABASE_URL` set: plain Postgres through Drizzle. Apply the schema with `npm run db:migrate -w @nyaypatra/web` (a deploy step; it reads `DATABASE_URL`). Change the schema in `src/server/store/db-schema.ts`, then `npm run db:generate -w @nyaypatra/web` and commit the new SQL under `drizzle/`.

`db:migrate` needs `scripts/migrate.mjs` and the SQL files under `drizzle/`, neither of which Next's
`output: "standalone"` build traces or copies (it only traces the JS module graph the server actually
imports at runtime, and migrations are SQL files nothing imports). Run `db:migrate` from a full source
checkout — a CI job, a Vercel build step, or the same machine you built on — before or independently of
shipping the standalone server elsewhere; do not expect it to work from a directory that only has
`.next/standalone/` copied into it.

- Not set: letters live in memory (fine for development, lost on restart). In production, not having `DATABASE_URL` is an error unless `PACKET_STORE=memory` is set on purpose (demos only). The settings are read by the first request that needs storage (a submission or a `/packet/<id>` visit), not at startup, so the server still starts and `/api/health` (which never touches storage) still passes: that request fails with a clear error instead. After deploying, check a real submission.
- `IP_HASH_SALT` (16+ characters, required whenever `DATABASE_URL` is set, in any environment; the in-memory store uses a public development salt) salts the hash used for rate limiting; addresses themselves are never stored. `RATE_LIMIT_PER_HOUR` defaults to 10.

The UTR never reaches the server: the form has no field for it, the server action ignores any `utr` it is sent, and the server leaves a `[[UTR]]` placeholder in UPI letters for the browser to fill in (the browser fills it in client-side via the packet page's optional UTR field — see `UtrBox`/`applyUtr`).

## Expiry cleanup

`POST /api/cleanup` deletes packets past `PACKET_TTL_DAYS` and old rate-limit windows. Reads already
treat an expired packet as gone (`PacketStore.get`), so this route only reclaims storage — nothing
breaks if it is never called, but disk/row growth is unbounded without it.

Protect it with `CRON_SECRET` (any long random string) and call it on a schedule. On Vercel, add to
`vercel.json`:

```json
{
  "crons": [{ "path": "/api/cleanup", "schedule": "0 3 * * *" }]
}
```

Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically once `CRON_SECRET` is set as an
environment variable — no extra wiring needed. Outside Vercel, call it the same way from any scheduler
(`curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cleanup`).
