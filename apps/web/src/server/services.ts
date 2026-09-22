import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { loadCompanyCatalog, type CompanyCatalog } from "@nyaypatra/core";
import { loadConfig, type ServerConfig } from "./env";
import * as schema from "./store/db-schema";
import { InMemoryPacketStore, InMemoryRateLimiter } from "./store/memory";
import { PostgresPacketStore, PostgresRateLimiter } from "./store/postgres";
import type { PacketStore, RateLimiter } from "./store/types";

export interface Services {
  store: PacketStore;
  limiter: RateLimiter;
  catalog: CompanyCatalog;
  ipHashSalt: string;
  trustProxyHops: number;
}

export function createServices(config: ServerConfig): Services {
  const catalog = loadCompanyCatalog();
  if (config.storage === "postgres") {
    const pool = new Pool({ connectionString: config.databaseUrl, max: 5 });
    // An idle connection dropping must not crash the server.
    pool.on("error", (error) => console.error(`database pool error: ${error.message}`));
    const db = drizzle(pool, { schema });
    return {
      store: new PostgresPacketStore(db),
      limiter: new PostgresRateLimiter(db, config.rateLimitPerHour),
      catalog,
      ipHashSalt: config.ipHashSalt,
      trustProxyHops: config.trustProxyHops,
    };
  }
  return {
    store: new InMemoryPacketStore(),
    limiter: new InMemoryRateLimiter(config.rateLimitPerHour),
    catalog,
    ipHashSalt: config.ipHashSalt,
    trustProxyHops: config.trustProxyHops,
  };
}

const HOLDER = Symbol.for("nyaypatra.services");

/** One set of services per server process (it also survives dev hot reloads). Reads the environment on first use. */
export function getServices(): Services {
  const holder = globalThis as unknown as Record<symbol, Services | undefined>;
  return (holder[HOLDER] ??= createServices(loadConfig(process.env)));
}
