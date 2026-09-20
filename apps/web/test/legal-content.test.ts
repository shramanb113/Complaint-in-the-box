import { describe, it, expect } from "vitest";
import { LEGAL, LEGAL_UPDATED } from "../src/lib/legal-content";

const textOf = (doc: (typeof LEGAL)[keyof typeof LEGAL]) =>
  [doc.title, doc.summary, ...doc.sections.flatMap((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? [])])].join("\n");

describe("legal content", () => {
  it("has three dated documents, each with sections that say something", () => {
    for (const slug of ["disclaimer", "privacy", "terms"] as const) {
      const doc = LEGAL[slug];
      expect(doc.slug).toBe(slug);
      expect(doc.updated).toBe(LEGAL_UPDATED);
      expect(doc.sections.length).toBeGreaterThan(2);
      for (const section of doc.sections) {
        expect(section.heading.trim()).not.toBe("");
        expect((section.paragraphs?.length ?? 0) + (section.bullets?.length ?? 0)).toBeGreaterThan(0);
      }
    }
  });

  it("privacy states the promises the product is built around", () => {
    const text = textOf(LEGAL.privacy);
    expect(text).toMatch(/UTR[\s\S]{0,120}never sent to our servers/i);
    expect(text).toContain("7 days");
    expect(text).toContain("np_lang");
    expect(text).toMatch(/hash/i);
    expect(text).toMatch(/photo/i);
    expect(text).toMatch(/do not sell/i);
  });

  it("the disclaimer says this is not a lawyer, not the government, and files no cases", () => {
    const text = textOf(LEGAL.disclaimer);
    expect(text).toMatch(/not a lawyer/i);
    expect(text).toMatch(/not the government/i);
    expect(text).toMatch(/does not file/i);
  });

  it("the terms disclaim guarantees and legal advice", () => {
    const text = textOf(LEGAL.terms);
    expect(text).toMatch(/no guarantee|not guarantee|does not guarantee/i);
    expect(text).toMatch(/not (a )?legal advice|no legal advice/i);
  });

  it("never names a real company or claims an advocate", () => {
    for (const doc of Object.values(LEGAL)) {
      expect(textOf(doc)).not.toMatch(/flipkart|amazon|swiggy|zomato|meesho|myntra|paytm|phonepe|advocate no|bar council/i);
    }
  });
});
