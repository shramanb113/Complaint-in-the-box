import { describe, it, expect } from "vitest";
import { loadCompanyCatalog } from "../src/companies";
import { PlatformSchema } from "../src/schema";

describe("loadCompanyCatalog", () => {
  it("loads flipkart and gpay entries with all required fields", () => {
    const catalog = loadCompanyCatalog();
    expect(catalog.flipkart.legalName).toBe("Flipkart Internet Private Limited");
    expect(catalog.flipkart.grievanceUrl).toMatch(/^https:\/\//);
    expect(catalog.gpay.legalName).toBe("Google Pay");
  });

  it("loads swiggy, zomato, and zepto entries with all required fields", () => {
    const catalog = loadCompanyCatalog();
    expect(catalog.swiggy.legalName).toBe("Bundl Technologies Private Limited (Swiggy)");
    expect(catalog.swiggy.grievanceUrl).toMatch(/^https:\/\//);
    expect(catalog.zomato.legalName).toBe("Zomato Limited");
    expect(catalog.zepto.legalName).toBe("Kiranakart Technologies Private Limited (Zepto)");
  });
});

describe("catalog completeness", () => {
  it("has a complete entry for every platform except 'other'", () => {
    const catalog = loadCompanyCatalog();
    for (const platform of PlatformSchema.options.filter((p) => p !== "other")) {
      const entry = catalog[platform];
      expect(entry, platform).toBeDefined();
      expect(entry.legalName.length, `${platform} legalName`).toBeGreaterThan(0);
      expect(entry.grievanceUrl, `${platform} grievanceUrl`).toMatch(/^https:\/\//);
      expect(entry.nchCompanyHint.length, `${platform} nchCompanyHint`).toBeGreaterThan(0);
      expect(entry.chatHint.length, `${platform} chatHint`).toBeGreaterThan(0);
    }
  });
});
