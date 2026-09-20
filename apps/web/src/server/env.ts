import { z } from "zod";

export interface ServerConfig {
  storage: "memory" | "postgres";
  databaseUrl?: string;
  ipHashSalt: string;
  rateLimitPerHour: number;
}

/** Not secret, and only used away from production, so a fresh checkout runs with no setup. */
const DEV_SALT = "dev-only-salt-not-secret";

/** A copied .env.example leaves empty values behind; treat them as unset. */
const unlessBlank = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const EnvSchema = z.object({
  NODE_ENV: z.preprocess(unlessBlank, z.string().optional()),
  DATABASE_URL: z.preprocess(unlessBlank, z.string().optional()),
  PACKET_STORE: z.preprocess(unlessBlank, z.enum(["memory", "postgres"]).optional()),
  IP_HASH_SALT: z.preprocess(unlessBlank, z.string().min(16).optional()),
  RATE_LIMIT_PER_HOUR: z.preprocess(unlessBlank, z.coerce.number().int().min(1).max(1000).default(10)),
});

/**
 * Reads the server's settings. Called when a request first needs them, never at build time.
 * Error messages name the variable, never its value.
 */
export function loadConfig(env: Record<string, string | undefined>): ServerConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))].join(", ");
    throw new Error(`Invalid environment variable(s): ${names}`);
  }
  const { NODE_ENV, DATABASE_URL, PACKET_STORE, IP_HASH_SALT, RATE_LIMIT_PER_HOUR } = parsed.data;
  const production = NODE_ENV === "production";
  const storage = PACKET_STORE ?? (DATABASE_URL ? "postgres" : "memory");

  if (storage === "postgres" && !DATABASE_URL) {
    throw new Error("PACKET_STORE=postgres needs DATABASE_URL.");
  }
  if (production && storage === "memory" && PACKET_STORE !== "memory") {
    throw new Error("DATABASE_URL is required in production. Set PACKET_STORE=memory only for demos: letters are lost on restart.");
  }
  if (production && storage === "postgres" && !IP_HASH_SALT) {
    throw new Error("IP_HASH_SALT (at least 16 characters) is required in production.");
  }

  return {
    storage,
    databaseUrl: DATABASE_URL,
    ipHashSalt: IP_HASH_SALT ?? DEV_SALT,
    rateLimitPerHour: RATE_LIMIT_PER_HOUR,
  };
}
