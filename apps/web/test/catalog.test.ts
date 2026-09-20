import { describe, it, expect } from "vitest";
import { CategorySchema, TemplateIdSchema } from "@nyaypatra/core";
import { CATEGORY_ORDER, templatesByCategory } from "../src/lib/catalog";
import { pickerMessages } from "../src/lib/i18n/messages/picker";

describe("catalog", () => {
  it("orders every category exactly once", () => {
    expect([...CATEGORY_ORDER].sort()).toEqual([...CategorySchema.options].sort());
  });

  it("puts every core template in exactly one category, none empty", () => {
    const grouped = templatesByCategory();
    const all = Object.values(grouped).flat();
    expect([...all].sort()).toEqual([...TemplateIdSchema.options].sort());
    expect(new Set(all).size).toBe(all.length);
    for (const category of CATEGORY_ORDER) expect(grouped[category].length).toBeGreaterThan(0);
  });

  it("has a label in both languages for every template and category", () => {
    for (const locale of ["en", "hi"] as const) {
      const messages = pickerMessages[locale];
      for (const id of TemplateIdSchema.options) expect(messages.templates[id], `${locale} ${id}`).toBeTruthy();
      for (const category of CATEGORY_ORDER) {
        expect(messages.categories[category].title, `${locale} ${category}`).toBeTruthy();
        expect(messages.categories[category].example, `${locale} ${category}`).toBeTruthy();
      }
    }
  });
});
