import { describe, it, expect } from "vitest";
import {
  DEFAULT_UI_LOCALE,
  isUiLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  resolveUiLocale,
  UI_LOCALES,
} from "../src/lib/i18n/locale";

describe("ui locale", () => {
  it("supports English and Hindi and defaults to English", () => {
    expect(UI_LOCALES).toEqual(["en", "hi"]);
    expect(DEFAULT_UI_LOCALE).toBe("en");
  });

  it("accepts only the exact supported codes", () => {
    expect(isUiLocale("en")).toBe(true);
    expect(isUiLocale("hi")).toBe(true);
    for (const junk of ["HI", "hi-IN", "both", "", " hi", undefined, null, 1]) {
      expect(isUiLocale(junk)).toBe(false);
    }
  });

  it("resolves anything missing, unknown or tampered with to the default", () => {
    expect(resolveUiLocale("hi")).toBe("hi");
    expect(resolveUiLocale("en")).toBe("en");
    expect(resolveUiLocale(undefined)).toBe("en");
    expect(resolveUiLocale(null)).toBe("en");
    expect(resolveUiLocale("fr")).toBe("en");
    expect(resolveUiLocale("<script>")).toBe("en");
  });

  it("names the cookie and keeps it for a year", () => {
    expect(LOCALE_COOKIE).toBe("np_lang");
    expect(LOCALE_COOKIE_MAX_AGE_SECONDS).toBe(31_536_000);
  });
});
