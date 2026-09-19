import type { Category, TemplateId } from "./types";

/** Which intake category each template belongs to. Single source of truth for the schema and the web picker. */
export const TEMPLATE_CATEGORY: Record<TemplateId, Category> = {
  ecom_wrong_item: "ecommerce",
  ecom_not_delivered: "ecommerce",
  ecom_damaged: "ecommerce",
  ecom_refund_to_wallet: "ecommerce",
  ecom_seller_ghosted: "ecommerce",
  upi_debit_merchant_no_credit: "upi",
  upi_double_debit: "upi",
  food_missing_item: "food",
  food_wrong_item: "food",
  fee_drip_pricing: "hidden_fee",
};
