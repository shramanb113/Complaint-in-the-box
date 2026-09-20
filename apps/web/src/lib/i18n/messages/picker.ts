import type { Category, TemplateId } from "@nyaypatra/core";
import { defineMessages } from "../define";

export interface PickerStrings {
  kicker: string;
  title: string;
  hint: string;
  legend: string;
  templatesHeading: string;
  categories: Record<Category, { title: string; example: string }>;
  templates: Record<TemplateId, string>;
}

export const pickerMessages = defineMessages<PickerStrings>(
  {
    kicker: "Start here",
    title: "What went wrong?",
    hint: "Pick one, then the situation that matches.",
    legend: "Type of problem",
    templatesHeading: "Which one matches?",
    categories: {
      ecommerce: { title: "Online shopping", example: "Wrong, damaged or missing orders" },
      upi: { title: "UPI payment", example: "Money debited but not received" },
      food: { title: "Food delivery", example: "Missing or wrong items" },
      hidden_fee: { title: "Hidden charges", example: "Extra charges shown only at payment" },
    },
    templates: {
      ecom_wrong_item: "Wrong item delivered",
      ecom_not_delivered: "Order never arrived",
      ecom_damaged: "Item arrived damaged",
      ecom_refund_to_wallet: "Refund went to a wallet, not my account",
      ecom_seller_ghosted: "Seller stopped replying",
      upi_debit_merchant_no_credit: "UPI money debited, but the shop did not get it",
      upi_double_debit: "Charged twice for one payment",
      food_missing_item: "An item was missing from my order",
      food_wrong_item: "Received a different item",
      fee_drip_pricing: "Charged more than the listed price",
    },
  },
  {
    kicker: "यहाँ से शुरू करें",
    title: "क्या गड़बड़ हुई?",
    hint: "एक चुनें, फिर वह स्थिति जो आपसे मेल खाती है।",
    legend: "समस्या का प्रकार",
    templatesHeading: "इनमें से कौन-सी स्थिति है?",
    categories: {
      ecommerce: { title: "ऑनलाइन ख़रीदारी", example: "ग़लत, टूटे या न पहुँचे ऑर्डर" },
      upi: { title: "UPI भुगतान", example: "पैसा कटा, पर पहुँचा नहीं" },
      food: { title: "खाना डिलीवरी", example: "कम या ग़लत आइटम" },
      hidden_fee: { title: "छिपे हुए शुल्क", example: "भुगतान के समय ही दिखे अतिरिक्त शुल्क" },
    },
    templates: {
      ecom_wrong_item: "ग़लत सामान मिला",
      ecom_not_delivered: "ऑर्डर पहुँचा ही नहीं",
      ecom_damaged: "सामान टूटा-फूटा पहुँचा",
      ecom_refund_to_wallet: "रिफंड वॉलेट में गया, मेरे खाते में नहीं",
      ecom_seller_ghosted: "विक्रेता ने जवाब देना बंद कर दिया",
      upi_debit_merchant_no_credit: "UPI से पैसा कटा, पर दुकान को नहीं मिला",
      upi_double_debit: "एक भुगतान के लिए दो बार पैसा कटा",
      food_missing_item: "ऑर्डर में एक आइटम कम था",
      food_wrong_item: "दूसरा आइटम मिला",
      fee_drip_pricing: "लिखी क़ीमत से ज़्यादा लिया गया",
    },
  }
);
