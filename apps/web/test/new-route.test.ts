import { describe, it, expect } from "vitest";
import { parseNewRoute } from "../src/lib/new-route";

describe("parseNewRoute", () => {
  it("accepts a known category", () => {
    expect(parseNewRoute("ecommerce", undefined)).toEqual({ category: "ecommerce" });
  });

  it("rejects unknown or wrongly cased categories", () => {
    expect(parseNewRoute("bogus", undefined)).toBeNull();
    expect(parseNewRoute("Ecommerce", undefined)).toBeNull();
    expect(parseNewRoute("", undefined)).toBeNull();
  });

  it("keeps a template that belongs to the category", () => {
    expect(parseNewRoute("ecommerce", "ecom_wrong_item")).toEqual({
      category: "ecommerce",
      templateId: "ecom_wrong_item",
    });
    expect(parseNewRoute("hidden_fee", "fee_drip_pricing")).toEqual({
      category: "hidden_fee",
      templateId: "fee_drip_pricing",
    });
  });

  it("drops a template that is unknown, from another category, or repeated in the query", () => {
    expect(parseNewRoute("ecommerce", "nope")).toEqual({ category: "ecommerce" });
    expect(parseNewRoute("ecommerce", "upi_double_debit")).toEqual({ category: "ecommerce" });
    expect(parseNewRoute("ecommerce", ["ecom_wrong_item", "ecom_damaged"])).toEqual({ category: "ecommerce" });
  });

  it("treats prototype-property names as unknown, never as a hit", () => {
    for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(parseNewRoute(name, undefined), name).toBeNull();
      expect(parseNewRoute("ecommerce", name), name).toEqual({ category: "ecommerce" });
    }
  });

  it("ignores an empty template and a one-element array", () => {
    expect(parseNewRoute("ecommerce", "")).toEqual({ category: "ecommerce" });
    expect(parseNewRoute("ecommerce", ["ecom_wrong_item"])).toEqual({ category: "ecommerce" });
  });
});
