import { describe, it, expect } from "vitest";
import { DesiredRemedySchema, TemplateIdSchema } from "@nyaypatra/core";
import { FIELD_ERRORS } from "../src/lib/intake/fields";
import { errorMessage } from "../src/lib/intake/errors";
import { formConfig } from "../src/lib/intake/form-config";
import { intakeMessages } from "../src/lib/i18n/messages/intake";
import { packetMessages } from "../src/lib/i18n/messages/packet";
import { ALL_MESSAGES } from "../src/lib/i18n/messages";

describe.each(["en", "hi"] as const)("intake messages (%s)", (locale) => {
  const t = intakeMessages[locale];

  it("has a message for every error code", () => {
    for (const code of FIELD_ERRORS) expect(t.errors[code], code).toBeTruthy();
  });

  it("has a label for every remedy any template offers", () => {
    for (const id of TemplateIdSchema.options) {
      for (const remedy of formConfig(id).remedies) expect(t.remedies[remedy], remedy).toBeTruthy();
    }
    expect(Object.keys(t.remedies).sort()).toEqual([...DesiredRemedySchema.options].sort());
  });

  it("fills the character limits into the length errors", () => {
    expect(errorMessage("tooShort", "whatHappened", t)).toContain("20");
    expect(errorMessage("tooLong", "whatHappened", t)).toContain("400");
    expect(errorMessage("tooLong", "orderId", t)).toContain("30");
    for (const code of FIELD_ERRORS) expect(errorMessage(code, "whatHappened", t), code).not.toMatch(/[{}]/);
  });
});

describe("registry", () => {
  it("registers both blocks so the parity test covers them", () => {
    expect(ALL_MESSAGES.intake).toBe(intakeMessages);
    expect(ALL_MESSAGES.packet).toBe(packetMessages);
  });

  it("tells a person what reserved text to remove", () => {
    expect(intakeMessages.en.errors.reservedText).toContain("[[UTR]]");
    expect(intakeMessages.hi.errors.reservedText).toContain("[[UTR]]");
  });
});
