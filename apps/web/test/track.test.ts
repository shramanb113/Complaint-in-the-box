// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { track } from "../src/lib/analytics/track";

afterEach(() => {
  delete window.plausible;
  vi.restoreAllMocks();
});

describe("track", () => {
  it("calls window.plausible with the event and props when a provider is loaded", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    track("category_selected", { category: "ecommerce" });
    expect(plausible).toHaveBeenCalledWith("category_selected", { props: { category: "ecommerce" } });
  });

  it("omits the options object when there are no props", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    track("landing_view");
    expect(plausible).toHaveBeenCalledWith("landing_view", undefined);
  });

  it("does not throw when no provider is loaded", () => {
    expect(() => track("form_started", { templateId: "ecom_wrong_item" })).not.toThrow();
  });
});
