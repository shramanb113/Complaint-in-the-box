/** Every field the form can send. The order is the order they appear on the page. */
export const FIELD_NAMES = [
  "platform",
  "companyName",
  "orderId",
  "amountInr",
  "listedPriceInr",
  "paidOn",
  "deliveredOn",
  "whatHappened",
  "alreadyDid",
  "desiredRemedy",
  "deadlineDays",
  "city",
  "userDisplayName",
] as const;

export type FieldName = (typeof FIELD_NAMES)[number];

/** What the browser sends: every field is a string, "" when left empty. */
export type RawIntake = Record<FieldName, string>;

export const EMPTY_RAW: RawIntake = Object.fromEntries(FIELD_NAMES.map((name) => [name, ""])) as RawIntake;

/** Why a field was rejected. Each code has plain-language text in both languages (messages/intake.ts). */
export const FIELD_ERRORS = [
  "required",
  "tooShort",
  "tooLong",
  "notNumber",
  "notWholeRupees",
  "notPositive",
  "tooBig",
  "badDate",
  "futureDate",
  "tooOld",
  "listedNotLess",
  "invalidChoice",
  "reservedText",
  "invalid",
] as const;

export type FieldError = (typeof FIELD_ERRORS)[number];

export type FormErrors = Partial<Record<FieldName, FieldError>>;

/** Mirrors the free-text bounds in core's intake schema; the schema stays the final authority. */
export const LIMITS = {
  companyName: { max: 60 },
  orderId: { max: 30 },
  city: { max: 50 },
  userDisplayName: { max: 50 },
  whatHappened: { min: 20, max: 400 },
  alreadyDid: { max: 200 },
} as const;

export const DEADLINE_DAYS = [2, 7, 15] as const;
