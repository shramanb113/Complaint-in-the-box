import { MAX_AMOUNT_INR } from "@nyaypatra/core";

export type MoneyResult =
  | { ok: true; value: number }
  | { ok: false; error: "required" | "notNumber" | "notWholeRupees" | "notPositive" | "tooBig" };

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/**
 * Turns what a person typed ("₹2,49,999", "Rs. 2499", "१,२९९", "2499.00") into whole rupees.
 * Paise are refused rather than rounded: this number goes into a complaint.
 */
export function parseMoney(input: string): MoneyResult {
  const text = input
    .replace(/[०-९]/g, (digit) => String(DEVANAGARI_DIGITS.indexOf(digit)))
    .replace(/₹|rs\.?|inr/gi, "")
    .replace(/[\s, ]/g, "");
  if (text === "") return { ok: false, error: "required" };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, error: "notNumber" };
  const [whole, fraction = ""] = text.split(".");
  if (/[1-9]/.test(fraction)) return { ok: false, error: "notWholeRupees" };
  const digits = whole.replace(/^0+(?=\d)/, "");
  // More than 10 digits is beyond the ceiling and could lose precision as a number.
  if (digits.length > 10) return { ok: false, error: "tooBig" };
  const value = Number(digits);
  if (value <= 0) return { ok: false, error: "notPositive" };
  if (value > MAX_AMOUNT_INR) return { ok: false, error: "tooBig" };
  return { ok: true, value };
}
