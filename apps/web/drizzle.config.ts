import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/store/db-schema.ts",
  out: "./drizzle",
});
