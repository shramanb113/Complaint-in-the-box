import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = fileURLToPath(new URL("../src", import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const importsServer = (source: string) => /from\s+["'](?:@\/server\/|(?:\.\.?\/)+(?:.*\/)?server\/)/.test(source);

describe("server code stays on the server", () => {
  const files = walk(src).map((path) => ({ path, source: readFileSync(path, "utf8") }));

  it("finds the source files it is meant to check", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("no client component imports anything from src/server", () => {
    const clients = files.filter(({ source }) => /^\s*["']use client["']/.test(source));
    expect(clients.length).toBeGreaterThan(0);
    for (const { path, source } of clients) expect(importsServer(source), path).toBe(false);
  });

  it("the shared lib folder (used by the browser) never imports from src/server", () => {
    for (const { path, source } of files.filter(({ path }) => /[\\/]src[\\/]lib[\\/]/.test(path))) {
      expect(importsServer(source), path).toBe(false);
    }
  });
});
