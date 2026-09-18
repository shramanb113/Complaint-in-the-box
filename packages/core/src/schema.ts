import { z } from "zod";

export const LocaleSchema = z.enum(["en", "hi", "both"]);
export const CategorySchema = z.enum(["ecommerce", "upi", "food", "hidden_fee"]);

export const TemplateIdSchema = z.enum([
  "ecom_wrong_item",
  "ecom_not_delivered",
  "ecom_damaged",
  "ecom_refund_to_wallet",
  "ecom_seller_ghosted",
  "upi_debit_merchant_no_credit",
  "upi_double_debit",
  "food_missing_item",
  "food_wrong_item",
  "fee_drip_pricing",
]);

export const PlatformSchema = z.enum([
  "flipkart",
  "amazon",
  "meesho",
  "myntra",
  "ajio",
  "zepto",
  "blinkit",
  "swiggy",
  "zomato",
  "gpay",
  "phonepe",
  "paytm",
  "other",
]);

export const DesiredRemedySchema = z.enum([
  "full_refund_original_mode",
  "replacement",
  "pickup_and_refund",
  "reverse_failed_upi",
  "remove_hidden_fee",
]);

function isNotFutureIsoDate(val: string): boolean {
  const d = new Date(val + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)
  );
  return d < todayUtcMidnight;
}

const isoDateNotFuture = z
  .string()
  .refine(isNotFutureIsoDate, { message: "Date cannot be in the future" });

export const IntakeSchema = z
  .object({
    category: CategorySchema,
    templateId: TemplateIdSchema,
    locale: LocaleSchema,
    platform: PlatformSchema,
    companyName: z.string().min(1).optional(),
    orderId: z.string().optional(),
    utr: z.string().optional(),
    amountInr: z.number().int().positive(),
    paidOn: isoDateNotFuture,
    deliveredOn: isoDateNotFuture.optional(),
    issueOn: isoDateNotFuture.optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    whatHappened: z.string().min(20).max(600),
    alreadyDid: z.string().optional(),
    desiredRemedy: DesiredRemedySchema,
    deadlineDays: z.union([z.literal(2), z.literal(7), z.literal(15)]),
    userDisplayName: z.string().optional(),
  })
  .refine((data) => data.platform !== "other" || !!data.companyName, {
    message: "companyName is required when platform is 'other'",
    path: ["companyName"],
  });
