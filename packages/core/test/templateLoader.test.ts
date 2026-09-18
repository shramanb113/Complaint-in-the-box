import { describe, it, expect } from "vitest";
import { parseTemplateMarkdown, fillSlots, loadTemplateFile } from "../src/templateLoader";

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

describe("loadTemplateFile - ecom_wrong_item", () => {
  it("loads and parses both language files without throwing", () => {
    expect(() => loadTemplateFile("ecom_wrong_item", "en")).not.toThrow();
    expect(() => loadTemplateFile("ecom_wrong_item", "hi")).not.toThrow();
  });

  it("the English WhatsApp section fits within 700 characters once a typical fixture is substituted", () => {
    const sections = loadTemplateFile("ecom_wrong_item", "en");
    // static text length only — full slot-filled length is asserted in generatePacket.test.ts
    expect(sections.whatsapp.length).toBeLessThan(700);
  });
});

describe("loadTemplateFile - upi_debit_merchant_no_credit", () => {
  it("loads and parses both language files without throwing", () => {
    expect(() => loadTemplateFile("upi_debit_merchant_no_credit", "en")).not.toThrow();
    expect(() => loadTemplateFile("upi_debit_merchant_no_credit", "hi")).not.toThrow();
  });

  it("mentions RBI/NPCI turnaround times, never a specific penalty amount", () => {
    const sections = loadTemplateFile("upi_debit_merchant_no_credit", "en");
    expect(sections.email_body).toMatch(/RBI \/ NPCI turnaround times/);
    expect(sections.whatsapp + sections.email_body).not.toMatch(/penalty/i);
  });
});
