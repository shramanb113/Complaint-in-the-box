import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CompanyCatalog } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadCompanyCatalog(): CompanyCatalog {
  const raw = readFileSync(join(__dirname, "..", "data", "companies.json"), "utf-8");
  return JSON.parse(raw) as CompanyCatalog;
}
