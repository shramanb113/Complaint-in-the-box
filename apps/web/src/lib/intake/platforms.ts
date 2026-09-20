import type { Platform } from "@nyaypatra/core";

/**
 * Brand names as people see them on their phones. Not translated (ruling R13), so they live here and
 * not in the bilingual messages. "Other" is worded in the messages because it is a word, not a name.
 */
export const PLATFORM_NAMES: Record<Exclude<Platform, "other">, string> = {
  flipkart: "Flipkart",
  amazon: "Amazon",
  meesho: "Meesho",
  myntra: "Myntra",
  ajio: "Ajio",
  zepto: "Zepto",
  blinkit: "Blinkit",
  swiggy: "Swiggy",
  zomato: "Zomato",
  gpay: "Google Pay",
  phonepe: "PhonePe",
  paytm: "Paytm",
};
