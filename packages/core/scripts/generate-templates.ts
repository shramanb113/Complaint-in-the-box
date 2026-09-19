import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTemplatesModuleSource } from "./templates-source";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src", "generated", "templates.generated.ts");

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buildTemplatesModuleSource(join(root, "data", "templates")), "utf-8");
console.log(`wrote ${out}`);
