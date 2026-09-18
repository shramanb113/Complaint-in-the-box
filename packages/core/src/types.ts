export type Locale = "en" | "hi" | "both";

export type Category = "ecommerce" | "upi" | "food" | "hidden_fee";

export type TemplateId =
  | "ecom_wrong_item"
  | "ecom_not_delivered"
  | "ecom_damaged"
  | "ecom_refund_to_wallet"
  | "ecom_seller_ghosted"
  | "upi_debit_merchant_no_credit"
  | "upi_double_debit"
  | "food_missing_item"
  | "food_wrong_item"
  | "fee_drip_pricing";

export type Platform =
  | "flipkart"
  | "amazon"
  | "meesho"
  | "myntra"
  | "ajio"
  | "zepto"
  | "blinkit"
  | "swiggy"
  | "zomato"
  | "gpay"
  | "phonepe"
  | "paytm"
  | "other";

export type DesiredRemedy =
  | "full_refund_original_mode"
  | "replacement"
  | "pickup_and_refund"
  | "reverse_failed_upi"
  | "remove_hidden_fee";

export interface Intake {
  category: Category;
  templateId: TemplateId;
  locale: Locale;
  platform: Platform;
  companyName?: string;
  orderId?: string;
  utr?: string;
  amountInr: number;
  paidOn: string;
  deliveredOn?: string;
  issueOn?: string;
  city?: string;
  state?: string;
  whatHappened: string;
  alreadyDid?: string;
  desiredRemedy: DesiredRemedy;
  deadlineDays: 2 | 7 | 15;
  userDisplayName?: string;
}

export interface CompanyInfo {
  legalName: string;
  grievanceUrl: string;
  nchCompanyHint: string;
  chatHint: string;
}

export type CompanyCatalog = Record<string, CompanyInfo>;

export interface Packet {
  id: string;
  createdAt: string;
  intake: Omit<Intake, "utr">;
  artifacts: {
    whatsapp: { en: string; hi: string };
    emailSubject: { en: string; hi: string };
    emailBody: { en: string; hi: string };
    nchFields: Record<string, string>;
    bankFields?: Record<string, string>;
    portalLinks: { label: string; href: string; help: string }[];
    nextSteps: { en: string[]; hi: string[] };
  };
}
