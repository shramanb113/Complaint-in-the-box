import { describe, it, expect } from "vitest";
import { parseTemplateMarkdown, fillSlots } from "../src/templateLoader";

describe("parseTemplateMarkdown", () => {
  it("splits a template file into its three named sections", () => {
    const raw = `## whatsapp
Hello {{name}}.

## email_subject
Subject line

## email_body
Dear {{name}},
Body text.
`;
    const sections = parseTemplateMarkdown(raw);
    expect(sections.whatsapp).toBe("Hello {{name}}.");
    expect(sections.email_subject).toBe("Subject line");
    expect(sections.email_body).toBe("Dear {{name}},\nBody text.");
  });

  it("throws if a required section is missing", () => {
    expect(() => parseTemplateMarkdown("## whatsapp\nOnly this section.")).toThrow();
  });
});

describe("fillSlots", () => {
  it("replaces every {{slot}} with its value", () => {
    expect(fillSlots("Hi {{name}}, you paid {{amount}}.", { name: "Priya", amount: "500" })).toBe(
      "Hi Priya, you paid 500."
    );
  });

  it("throws if a slot has no provided value", () => {
    expect(() => fillSlots("Hi {{name}}.", {})).toThrow();
  });
});
