import { describe, it, expect } from "vitest";
import { isDesignPageEnabled } from "../src/lib/design-page";

describe("isDesignPageEnabled", () => {
  it("is enabled in development and test", () => {
    expect(isDesignPageEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isDesignPageEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(isDesignPageEnabled({})).toBe(true);
  });

  it("is hidden in production by default", () => {
    expect(isDesignPageEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isDesignPageEnabled({ NODE_ENV: "production", NEXT_PUBLIC_SHOW_DESIGN: "0" })).toBe(false);
  });

  it("can be switched on in production with NEXT_PUBLIC_SHOW_DESIGN=1", () => {
    expect(isDesignPageEnabled({ NODE_ENV: "production", NEXT_PUBLIC_SHOW_DESIGN: "1" })).toBe(true);
  });
});
