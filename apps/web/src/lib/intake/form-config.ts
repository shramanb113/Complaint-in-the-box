import { TEMPLATE_CATEGORY, type Category, type DesiredRemedy, type Platform, type TemplateId } from "@nyaypatra/core";
import { EMPTY_RAW, type RawIntake } from "./fields";

/** What the form shows for one template. Everything else about a template lives in core. */
export interface FormConfig {
  templateId: TemplateId;
  category: Category;
  /** Platform chips, always ending with "other". */
  platforms: readonly Platform[];
  /** UPI: the shop or person paid is always asked. Elsewhere the company name is only asked for "other". */
  companyNameAlways: boolean;
  showOrderId: boolean;
  showDeliveredOn: boolean;
  showListedPrice: boolean;
  /** One entry means the remedy is fixed and only shown; several mean a choice. The first is the default. */
  remedies: readonly DesiredRemedy[];
}

const SHOPS: readonly Platform[] = ["flipkart", "amazon", "meesho", "myntra", "ajio", "zepto", "blinkit"];

const PLATFORMS: Record<Category, readonly Platform[]> = {
  ecommerce: [...SHOPS, "other"],
  upi: ["gpay", "phonepe", "paytm", "other"],
  food: ["swiggy", "zomato", "other"],
  hidden_fee: [...SHOPS, "swiggy", "zomato", "other"],
};

/** Typed as a Record so a new template cannot be added to core without deciding its remedies here. */
const REMEDIES: Record<TemplateId, readonly DesiredRemedy[]> = {
  ecom_wrong_item: ["pickup_and_refund", "replacement", "full_refund_original_mode"],
  ecom_not_delivered: ["full_refund_original_mode"],
  ecom_damaged: ["full_refund_original_mode", "replacement"],
  ecom_refund_to_wallet: ["full_refund_original_mode"],
  ecom_seller_ghosted: ["full_refund_original_mode"],
  upi_debit_merchant_no_credit: ["reverse_failed_upi"],
  upi_double_debit: ["reverse_failed_upi"],
  food_missing_item: ["full_refund_original_mode"],
  food_wrong_item: ["full_refund_original_mode"],
  fee_drip_pricing: ["remove_hidden_fee"],
};

/** The templates whose letter mentions the delivery date. */
const USES_DELIVERY_DATE: ReadonlySet<TemplateId> = new Set<TemplateId>(["ecom_wrong_item", "ecom_damaged"]);

export function formConfig(templateId: TemplateId): FormConfig {
  const category = TEMPLATE_CATEGORY[templateId];
  return {
    templateId,
    category,
    platforms: PLATFORMS[category],
    companyNameAlways: category === "upi",
    showOrderId: category !== "upi",
    showDeliveredOn: USES_DELIVERY_DATE.has(templateId),
    showListedPrice: templateId === "fee_drip_pricing",
    remedies: REMEDIES[templateId],
  };
}

export function needsCompanyName(config: FormConfig, platform: string): boolean {
  return config.companyNameAlways || platform === "other";
}

/** What the form starts with: the default remedy and a 7-day deadline, everything else empty. */
export function defaultRaw(config: FormConfig): RawIntake {
  return { ...EMPTY_RAW, desiredRemedy: config.remedies[0], deadlineDays: "7" };
}
