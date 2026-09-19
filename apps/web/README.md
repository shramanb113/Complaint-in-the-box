# @nyaypatra/web

The Next.js 16 app, built as a standalone server. These are the facts a Dockerfile or host needs.

Build with the working directory set to `apps/web`, for example `npm run build -w @nyaypatra/web`. `next.config.ts` computes `outputFileTracingRoot` from `process.cwd()`, so building from any other directory produces a standalone output without the workspace packages.

Run the built server with `node .next/standalone/apps/web/server.js`. Do not use `next start`: Next warns that it does not work with `output: "standalone"`. The server reads `PORT` and `HOSTNAME`.

The standalone output does not include `.next/static` or `public/`. A deploy must copy both next to the standalone `server.js`, that is into `.next/standalone/apps/web/.next/static` and `.next/standalone/apps/web/public`. Without them the pages are served unstyled.

The `/design` gallery is hidden by default and returns 404 in production. Set `NEXT_PUBLIC_SHOW_DESIGN=1` at build time, not run time, to expose it.

Every page is `noindex` until Milestone 4.

Do not add `"type": "module"` to `apps/web/package.json`. The standalone build copies that file next to a CommonJS `server.js`, which would then fail to load.

`npm run smoke -w @nyaypatra/web` starts the built standalone server on port 3457, copies `.next/static` and `public/` into place as a deploy would, and checks the health endpoint, the home page, the hidden `/design` page and that the stylesheet is served.
