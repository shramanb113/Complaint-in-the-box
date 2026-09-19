import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTemplatesModuleSource } from "../scripts/templates-source";
import { TEMPLATES } from "../src/generated/templates.generated";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const normalize = (s: string) => s.replace(/\r\n/g, "\n");

describe("generated templates module", () => {
  it("is up to date with data/templates (run `npm run generate:templates -w @nyaypatra/core` if this fails)", () => {
    const expected = buildTemplatesModuleSource(join(root, "data", "templates"));
    const actual = readFileSync(join(root, "src", "generated", "templates.generated.ts"), "utf-8");
    expect(normalize(actual)).toBe(normalize(expected));
  });

  it("contains an en and a hi entry for each of the 10 templates", () => {
    expect(Object.keys(TEMPLATES)).toHaveLength(20);
    expect(TEMPLATES["ecom_wrong_item.en"]).toContain("## whatsapp");
    expect(TEMPLATES["fee_drip_pricing.hi"]).toContain("## email_body");
  });

  describe("buildTemplatesModuleSource", () => {
    let dir: string;
    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "tpl-"));
    });
    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it("emits no carriage returns for CRLF template files", () => {
      writeFileSync(join(dir, "x.en.md"), "## a\r\nb\r\n");
      expect(buildTemplatesModuleSource(dir)).not.toContain("\\r");
    });

    it("ignores files that are not <templateId>.<en|hi>.md", () => {
      writeFileSync(join(dir, "x.en.md"), "## a\n");
      writeFileSync(join(dir, "README.md"), "# notes\n");
      writeFileSync(join(dir, "y.fr.md"), "## a\n");
      const source = buildTemplatesModuleSource(dir);
      expect(source).toContain('"x.en"');
      expect(source).not.toContain("README");
      expect(source).not.toContain("y.fr");
    });
  });
});
