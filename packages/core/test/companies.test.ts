import { describe, it, expect } from "vitest";
import { loadCompanyCatalog } from "../src/companies";
import { PlatformSchema } from "../src/schema";
import type { CompanyInfo, Platform } from "../src/types";

/** Fails loudly (instead of a bare TypeError) when a platform has no catalog entry. */
function entryFor(platform: Platform): CompanyInfo {
  const entry = loadCompanyCatalog()[platform];
  if (!entry) throw new Error(`no catalog entry for platform "${platform}"`);
  return entry;
}

describe("loadCompanyCatalog", () => {
  it("loads flipkart and gpay entries with all required fields", () => {
    expect(entryFor("flipkart").legalName).toBe("Flipkart Internet Private Limited");
    expect(entryFor("flipkart").grievanceUrl).toMatch(/^https:\/\//);
    expect(entryFor("gpay").legalName).toBe("Google Pay");
  });

  it("loads swiggy, zomato, and zepto entries with all required fields", () => {
    expect(entryFor("swiggy").legalName).toBe("Bundl Technologies Private Limited (Swiggy)");
    expect(entryFor("swiggy").grievanceUrl).toMatch(/^https:\/\//);
    expect(entryFor("zomato").legalName).toBe("Zomato Limited");
    expect(entryFor("zepto").legalName).toBe("Kiranakart Technologies Private Limited (Zepto)");
  });

  it("has no entry for 'other' (the type says so: a lookup is possibly undefined)", () => {
    expect(loadCompanyCatalog()["other"]).toBeUndefined();
  });
});

describe("catalog completeness", () => {
  it("has a complete entry for every platform except 'other'", () => {
    for (const platform of PlatformSchema.options.filter((p) => p !== "other")) {
      const entry = entryFor(platform);
      expect(entry.legalName.length, `${platform} legalName`).toBeGreaterThan(0);
      expect(entry.grievanceUrl, `${platform} grievanceUrl`).toMatch(/^https:\/\//);
      expect(entry.nchCompanyHint.length, `${platform} nchCompanyHint`).toBeGreaterThan(0);
      expect(entry.chatHint.length, `${platform} chatHint`).toBeGreaterThan(0);
    }
  });
});
