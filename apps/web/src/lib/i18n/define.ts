import type { UiLocale } from "./locale";

/** One block of site text in both languages. */
export type Bilingual<T> = Record<UiLocale, T>;

/**
 * Both sides must have exactly the same shape, which TypeScript enforces here; the parity test
 * (messages-parity.test.ts) checks array lengths, empty strings, scripts and placeholders.
 */
export function defineMessages<T>(en: T, hi: T): Bilingual<T> {
  return { en, hi };
}

/** Replaces {name} markers. A marker with no value is left visible so the mistake shows up. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (marker, key: string) => (key in values ? String(values[key]) : marker));
}

/** The markers in a template, sorted (repeats included). */
export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}
