// Applies the SQL migrations in apps/web/drizzle to the database in DATABASE_URL.
// Run it as a deploy step: npm run db:migrate -w @nyaypatra/web
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

// next dev/build load .env.local automatically; a standalone script like this one does not, so a
// developer running `npm run db:migrate` locally against DATABASE_URL in .env.local got nothing. This
// only fills in variables process.env doesn't already have, so a real deploy's own DATABASE_URL wins.
nextEnv.loadEnvConfig(fileURLToPath(new URL("..", import.meta.url)));

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  console.log("Migrations applied.");
} catch (error) {
  console.error(`Migration failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
