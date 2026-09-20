import { describe, it, expect } from "vitest";
import { contactEmail, SITE } from "../src/lib/site";

describe("contactEmail", () => {
  it("is undefined until the founder sets an address", () => {
    expect(contactEmail({})).toBeUndefined();
    expect(contactEmail({ CONTACT_EMAIL: "" })).toBeUndefined();
    expect(contactEmail({ CONTACT_EMAIL: "   " })).toBeUndefined();
  });

  it("returns a well-formed address, trimmed", () => {
    expect(contactEmail({ CONTACT_EMAIL: " help@example.org " })).toBe("help@example.org");
  });

  it("ignores something that is not an email address", () => {
    expect(contactEmail({ CONTACT_EMAIL: "not an email" })).toBeUndefined();
    expect(contactEmail({ CONTACT_EMAIL: "a@b" })).toBeUndefined();
  });

  it("ignores a value that would smuggle a mailto parameter or a scheme into the link", () => {
    expect(contactEmail({ CONTACT_EMAIL: "x?cc=y.com@z.org" })).toBeUndefined();
    expect(contactEmail({ CONTACT_EMAIL: "javascript:x@a.b" })).toBeUndefined();
  });

  it("names the site", () => {
    expect(SITE.name).toBe("Nyay Patra");
  });
});
