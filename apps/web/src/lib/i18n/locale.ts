/**
 * The language of the site's own text. This is not core's `Locale`, which is the language of a
 * generated letter and also allows "both".
 */
export const UI_LOCALES = ["en", "hi"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const DEFAULT_UI_LOCALE: UiLocale = "en";
export const LOCALE_COOKIE = "np_lang";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isUiLocale(value: unknown): value is UiLocale {
  return typeof value === "string" && (UI_LOCALES as readonly string[]).includes(value);
}

/** Anything missing, unknown or tampered with becomes the default language. */
export function resolveUiLocale(value: string | null | undefined): UiLocale {
  return isUiLocale(value) ? value : DEFAULT_UI_LOCALE;
}
