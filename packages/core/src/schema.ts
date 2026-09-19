import { z } from "zod";
import { nowToIstYMD, ymdFromISODate, type YMD } from "./dates";
import type { Intake } from "./types";
import { TEMPLATE_CATEGORY } from "./templateCategory";

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

/**
 * "Today" for date-boundary validation must be the IST calendar date, not the
 * UTC calendar date — the rest of the codebase (dates.ts) treats "today" as
 * nowToIstYMD(). Comparing YMD values as y*10000 + m*100 + d is equivalent to
 * lexicographic comparison of the zero-padded ISO string form.
 */
function ymdToComparable(ymd: YMD): number {
  return ymd.y * 10000 + ymd.m * 100 + ymd.d;
}

export function isNotFutureIsoDate(val: string, now: Date = new Date()): boolean {
  const d = new Date(val + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return false;
  const submitted = ymdFromISODate(val);
  const todayIst = nowToIstYMD(now);
  return ymdToComparable(submitted) <= ymdToComparable(todayIst);
}

function createIsoDateNotFutureSchema(now: Date = new Date()) {
  return z
    .string()
    .refine((val) => isNotFutureIsoDate(val, now), { message: "Date cannot be in the future" });
}

/**
 * Factory so tests can inject a fixed `now` (mirrors computeDeadlineYMD's
 * pattern in dates.ts). Defaults to the real current time for production use.
 */
export function createIntakeSchema(now: Date = new Date()): z.ZodType<Intake> {
  const isoDateNotFuture = createIsoDateNotFutureSchema(now);

  return z
    .object({
      category: CategorySchema,
      templateId: TemplateIdSchema,
      locale: LocaleSchema,
      platform: PlatformSchema,
      companyName: z.string().trim().min(1).max(60).optional(),
      orderId: z.string().max(30).optional(),
      utr: z.string().max(35).optional(),
      amountInr: z.number().int().positive(),
      listedPriceInr: z.number().int().positive().optional(),
      paidOn: isoDateNotFuture,
      deliveredOn: isoDateNotFuture.optional(),
      issueOn: isoDateNotFuture.optional(),
      city: z.string().max(50).optional(),
      state: z.string().max(50).optional(),
      whatHappened: z.string().min(20).max(400),
      alreadyDid: z.string().max(200).optional(),
      desiredRemedy: DesiredRemedySchema,
      deadlineDays: z.union([z.literal(2), z.literal(7), z.literal(15)]),
      userDisplayName: z.string().max(50).optional(),
    })
    .refine((data) => data.platform !== "other" || !!data.companyName, {
      message: "companyName is required when platform is 'other'",
      path: ["companyName"],
    })
    .refine(
      (data) =>
        data.templateId !== "fee_drip_pricing" ||
        (data.listedPriceInr !== undefined && data.listedPriceInr < data.amountInr),
      {
        message:
          "listedPriceInr is required and must be less than amountInr for fee_drip_pricing",
        path: ["listedPriceInr"],
      }
    )
    .refine((data) => TEMPLATE_CATEGORY[data.templateId] === data.category, {
      message: "templateId does not belong to the chosen category",
      path: ["templateId"],
    });
}

export const IntakeSchema: z.ZodType<Intake> = createIntakeSchema();
