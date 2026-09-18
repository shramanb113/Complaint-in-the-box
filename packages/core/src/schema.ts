import { z } from "zod";
import { nowToIstYMD, ymdFromISODate, type YMD } from "./dates";
import type { Intake } from "./types";

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
      companyName: z.string().min(1).optional(),
      orderId: z.string().optional(),
      utr: z.string().optional(),
      amountInr: z.number().int().positive(),
      paidOn: isoDateNotFuture,
      deliveredOn: isoDateNotFuture.optional(),
      issueOn: isoDateNotFuture.optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      whatHappened: z.string().min(20).max(400),
      alreadyDid: z.string().optional(),
      desiredRemedy: DesiredRemedySchema,
      deadlineDays: z.union([z.literal(2), z.literal(7), z.literal(15)]),
      userDisplayName: z.string().optional(),
    })
    .refine((data) => data.platform !== "other" || !!data.companyName, {
      message: "companyName is required when platform is 'other'",
      path: ["companyName"],
    });
}

export const IntakeSchema: z.ZodType<Intake> = createIntakeSchema();
