import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface TemplateSections {
  whatsapp: string;
  email_subject: string;
  email_body: string;
}

const REQUIRED_SECTIONS: (keyof TemplateSections)[] = ["whatsapp", "email_subject", "email_body"];

export function parseTemplateMarkdown(raw: string): TemplateSections {
  const sections: Record<string, string> = {};
  const parts = raw.split(/^##\s+(\w+)\s*$/m).slice(1);
  for (let i = 0; i < parts.length; i += 2) {
    const key = parts[i].trim();
    const body = parts[i + 1].trim();
    sections[key] = body;
  }
  for (const key of REQUIRED_SECTIONS) {
    if (!sections[key]) {
      throw new Error(`Template markdown missing required section "## ${key}"`);
    }
  }
  return sections as TemplateSections;
}

export function fillSlots(text: string, slots: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in slots)) {
      throw new Error(`Missing slot value for {{${key}}}`);
    }
    return slots[key];
  });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "data", "templates");

export function loadTemplateFile(templateId: string, locale: "en" | "hi"): TemplateSections {
  const path = join(TEMPLATES_DIR, `${templateId}.${locale}.md`);
  const raw = readFileSync(path, "utf-8");
  return parseTemplateMarkdown(raw);
}
