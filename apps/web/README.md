# @nyaypatra/web

The Next.js 16 app, built as a standalone server. These are the facts a Dockerfile or host needs.

Build with the working directory set to `apps/web`, for example `npm run build -w @nyaypatra/web`. `next.config.ts` computes `outputFileTracingRoot` from `process.cwd()`, so building from any other directory produces a standalone output without the workspace packages.

Run the built server with `node .next/standalone/apps/web/server.js`, which is what `npm start -w @nyaypatra/web` runs. Do not use `next start`: Next warns that it does not work with `output: "standalone"`. The server reads `PORT` and `HOSTNAME`. Copy `.next/static` and `public/` into place first (below), or use `npm run smoke -w @nyaypatra/web`, which does it for you.

The standalone output does not include `.next/static` or `public/`. A deploy must copy both next to the standalone `server.js`, that is into `.next/standalone/apps/web/.next/static` and `.next/standalone/apps/web/public`. Without them the pages are served unstyled.

The `/design` gallery is hidden by default and returns 404 in production. Set `NEXT_PUBLIC_SHOW_DESIGN=1` at build time, not run time, to expose it.

`noindex` is set in page metadata only; `robots.txt` and the `X-Robots-Tag` header arrive with Milestone 4.

Do not add `"type": "module"` to `apps/web/package.json`. The standalone build copies that file next to a CommonJS `server.js`, which would then fail to load.

Every page is rendered per request, because the layout reads the `np_lang` language cookie (Next opts a route into dynamic rendering when it reads cookies). The cookie is set by a Server Action from the header's language toggle, is `HttpOnly`, lasts a year, and only accepts `en` or `hi`. The legal pages read an optional `CONTACT_EMAIL` environment variable **at run time** and show a contact line only when it is set.

Routes: `/`, `/how-it-works`, `/new/[category]` (a stub until the intake form ships), `/legal/disclaimer`, `/legal/privacy`, `/legal/terms`, `/api/health`, and the hidden `/design`.

`npm run smoke -w @nyaypatra/web` starts the built standalone server on port 3457, copies `.next/static` and `public/` into place as a deploy would, and checks the health endpoint, the home page, every public page, the 404s, that the language cookie switches `<html lang>` and the Hindi text, the hidden `/design` page and that the stylesheet is served.
