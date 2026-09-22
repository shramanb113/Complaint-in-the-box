import { z } from "zod";
import { isRealCalendarDate, nowToIstYMD, ymdFromISODate, type YMD } from "./dates";
import type { Intake } from "./types";
import { TEMPLATE_CATEGORY } from "./templateCategory";
import { UTR_TOKEN } from "./utr";

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

/** Sanity bounds. The amount ceiling is the width the WhatsApp-budget test already assumes; UPI did not exist before 2016. */
export const MAX_AMOUNT_INR = 999_999_999;
export const MIN_ISO_DATE = "2016-01-01";

/** The exact issue messages the schema emits. The web form maps issues to plain-language text by these strings. */
export const SCHEMA_ISSUES = {
  futureDate: "Date cannot be in the future",
  tooOldDate: `Date cannot be before ${MIN_ISO_DATE}`,
  companyRequired: "companyName is required when platform is 'other'",
  listedPrice: "listedPriceInr is required and must be less than amountInr for fee_drip_pricing",
  templateCategory: "templateId does not belong to the chosen category",
  reservedText: "Text cannot contain the reserved marker [[UTR]]",
} as const;

/** [[UTR]] is the server's placeholder for the UTR; nobody may type it into free text. */
const noReservedMarker = (schema: z.ZodString) =>
  schema.refine((val) => !val.includes(UTR_TOKEN), { message: SCHEMA_ISSUES.reservedText });

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
  if (!isRealCalendarDate(submitted)) return false;
  const todayIst = nowToIstYMD(now);
  return ymdToComparable(submitted) <= ymdToComparable(todayIst);
}

function createIsoDateNotFutureSchema(now: Date = new Date()) {
  return z
    .string()
    .refine((val) => isNotFutureIsoDate(val, now), { message: SCHEMA_ISSUES.futureDate })
    .refine((val) => val >= MIN_ISO_DATE, { message: SCHEMA_ISSUES.tooOldDate });
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
      companyName: noReservedMarker(z.string().trim().min(1).max(60)).optional(),
      orderId: noReservedMarker(z.string().max(30)).optional(),
      utr: z.string().max(35).optional(),
      amountInr: z.number().int().positive().max(MAX_AMOUNT_INR),
      listedPriceInr: z.number().int().positive().max(MAX_AMOUNT_INR).optional(),
      paidOn: isoDateNotFuture,
      deliveredOn: isoDateNotFuture.optional(),
      issueOn: isoDateNotFuture.optional(),
      city: noReservedMarker(z.string().max(50)).optional(),
      state: noReservedMarker(z.string().max(50)).optional(),
      whatHappened: noReservedMarker(z.string().min(20).max(400)),
      alreadyDid: noReservedMarker(z.string().max(200)).optional(),
      desiredRemedy: DesiredRemedySchema,
      deadlineDays: z.union([z.literal(2), z.literal(7), z.literal(15)]),
      userDisplayName: noReservedMarker(z.string().max(50)).optional(),
    })
    .refine((data) => data.platform !== "other" || !!data.companyName, {
      message: SCHEMA_ISSUES.companyRequired,
      path: ["companyName"],
    })
    .refine(
      (data) =>
        data.templateId !== "fee_drip_pricing" ||
        (data.listedPriceInr !== undefined && data.listedPriceInr < data.amountInr),
      {
        message: SCHEMA_ISSUES.listedPrice,
        path: ["listedPriceInr"],
      }
    )
    .refine((data) => TEMPLATE_CATEGORY[data.templateId] === data.category, {
      message: SCHEMA_ISSUES.templateCategory,
      path: ["templateId"],
    });
}

export const IntakeSchema: z.ZodType<Intake> = createIntakeSchema();
