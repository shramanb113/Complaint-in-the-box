import { describe, it, expect } from "vitest";
import { loadCompanyCatalog } from "../src/companies";

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
