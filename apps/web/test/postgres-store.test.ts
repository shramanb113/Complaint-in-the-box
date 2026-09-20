import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll } from "vitest";
import * as schema from "../src/server/store/db-schema";
import { PostgresPacketStore, PostgresRateLimiter, type Db } from "../src/server/store/postgres";
import { describePacketStore, describeRateLimiter } from "./helpers/store-contract";

// A real Postgres in memory, built by the same SQL migration that production runs.
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
let client: PGlite;
let db: Db;

beforeAll(async () => {
  client = new PGlite();
  const pglite = drizzle(client, { schema });
  await migrate(pglite, { migrationsFolder });
  db = pglite;
});

afterAll(async () => {
  await client.close();
});

async function empty(): Promise<Db> {
  await db.execute(sql`truncate table packets, rate_limits`);
  return db;
}

describePacketStore("PostgresPacketStore (PGlite)", async () => new PostgresPacketStore(await empty()));
describeRateLimiter("PostgresRateLimiter (PGlite)", async (limit) => new PostgresRateLimiter(await empty(), limit));
