import type { DesiredRemedy } from "./types";

export const REMEDY_TEXT: Record<DesiredRemedy, { en: string; hi: string }> = {
  full_refund_original_mode: {
    en: "a full refund to my original payment mode",
    hi: "मेरे मूल भुगतान माध्यम में पूरा रिफंड",
  },
  replacement: {
    en: "a replacement item",
    hi: "सामान की जगह नया सामान (रिप्लेसमेंट)",
  },
  pickup_and_refund: {
    en: "pickup of the wrong item and a full refund to the original payment mode",
    hi: "गलत सामान की पिकअप और मूल भुगतान माध्यम में पूरा रिफंड",
  },
  reverse_failed_upi: {
    en: "the amount to be reversed/credited back to my account",
    hi: "राशि की मेरे खाते में वापसी (रिवर्सल)",
  },
  remove_hidden_fee: {
    en: "a refund of the hidden charges and removal of the extra fee",
    hi: "छुपे हुए शुल्क की वापसी और अतिरिक्त शुल्क की समाप्ति",
  },
};
