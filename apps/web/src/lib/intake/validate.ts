import {
  createIntakeSchema,
  isNotFutureIsoDate,
  MIN_ISO_DATE,
  SCHEMA_ISSUES,
  UTR_TOKEN,
  type Intake,
  type TemplateId,
} from "@nyaypatra/core";
import { parseIsoDate } from "./dates";
import { DEADLINE_DAYS, FIELD_NAMES, LIMITS, type FieldError, type FieldName, type FormErrors, type RawIntake } from "./fields";
import { formConfig, needsCompanyName } from "./form-config";
import { parseMoney } from "./money";
import { cleanText } from "./text";

export type ValidationResult = { ok: true; intake: Intake } | { ok: false; errors: FormErrors };

/** Optional text unless `required`; `min` only applies to a non-empty value. */
function textField(
  value: string | undefined,
  name: FieldName,
  errors: FormErrors,
  limits: { min?: number; max: number },
  required = false
): string | undefined {
  const text = cleanText(value ?? "");
  if (text === "") {
    if (required) errors[name] = "required";
    return undefined;
  }
  if (text.includes(UTR_TOKEN)) {
    errors[name] = "reservedText";
    return undefined;
  }
  if (limits.min !== undefined && text.length < limits.min) {
    errors[name] = "tooShort";
    return undefined;
  }
  if (text.length > limits.max) {
    errors[name] = "tooLong";
    return undefined;
  }
  return text;
}

function moneyField(value: string | undefined, name: FieldName, errors: FormErrors): number | undefined {
  const parsed = parseMoney(value ?? "");
  if (!parsed.ok) {
    errors[name] = parsed.error;
    return undefined;
  }
  return parsed.value;
}

function dateField(value: string | undefined, name: FieldName, errors: FormErrors, now: Date, required: boolean): string | undefined {
  const parsed = parseIsoDate(value ?? "");
  if (!parsed.ok) {
    if (parsed.error === "badDate" || required) errors[name] = parsed.error;
    return undefined;
  }
  if (parsed.value < MIN_ISO_DATE) {
    errors[name] = "tooOld";
    return undefined;
  }
  if (!isNotFutureIsoDate(parsed.value, now)) {
    errors[name] = "futureDate";
    return undefined;
  }
  return parsed.value;
}

/**
 * Turns raw form strings into a valid core Intake, or says what is wrong with each field. The browser
 * calls this for instant feedback; the server calls it again and trusts nothing else. Only the fields
 * the template shows are read, and there is deliberately no UTR: the server adds its own placeholder.
 */
export function validateIntakeForm(templateId: TemplateId, raw: Partial<RawIntake>, now: Date = new Date()): ValidationResult {
  const config = formConfig(templateId);
  const errors: FormErrors = {};

  const platformRaw = (raw.platform ?? "").trim();
  const platform = config.platforms.find((candidate) => candidate === platformRaw);
  if (!platform) errors.platform = platformRaw === "" ? "required" : "invalidChoice";

  const companyName = needsCompanyName(config, platformRaw)
    ? textField(raw.companyName, "companyName", errors, LIMITS.companyName, true)
    : undefined;
  const orderId = config.showOrderId ? textField(raw.orderId, "orderId", errors, LIMITS.orderId) : undefined;

  const amountInr = moneyField(raw.amountInr, "amountInr", errors);
  let listedPriceInr: number | undefined;
  if (config.showListedPrice) {
    listedPriceInr = moneyField(raw.listedPriceInr, "listedPriceInr", errors);
    if (listedPriceInr !== undefined && amountInr !== undefined && listedPriceInr >= amountInr) {
      errors.listedPriceInr = "listedNotLess";
      listedPriceInr = undefined;
    }
  }

  const paidOn = dateField(raw.paidOn, "paidOn", errors, now, true);
  const deliveredOn = config.showDeliveredOn ? dateField(raw.deliveredOn, "deliveredOn", errors, now, false) : undefined;

  const whatHappened = textField(raw.whatHappened, "whatHappened", errors, LIMITS.whatHappened, true);
  const alreadyDid = textField(raw.alreadyDid, "alreadyDid", errors, LIMITS.alreadyDid);

  const remedyRaw = (raw.desiredRemedy ?? "").trim();
  const desiredRemedy = remedyRaw === "" ? config.remedies[0] : config.remedies.find((candidate) => candidate === remedyRaw);
  if (!desiredRemedy) errors.desiredRemedy = "invalidChoice";

  const deadlineRaw = (raw.deadlineDays ?? "").trim();
  const deadlineDays = DEADLINE_DAYS.find((days) => String(days) === deadlineRaw);
  if (deadlineDays === undefined) errors.deadlineDays = deadlineRaw === "" ? "required" : "invalidChoice";

  const city = textField(raw.city, "city", errors, LIMITS.city);
  const userDisplayName = textField(raw.userDisplayName, "userDisplayName", errors, LIMITS.userDisplayName);

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const parsed = createIntakeSchema(now).safeParse({
    category: config.category,
    templateId,
    locale: "both",
    platform,
    companyName,
    orderId,
    amountInr,
    listedPriceInr,
    paidOn,
    deliveredOn,
    city,
    whatHappened,
    alreadyDid,
    desiredRemedy,
    deadlineDays,
    userDisplayName,
  });
  // Core's schema is the final authority. If it disagrees with the checks above, that is a drift bug, not a user error.
  if (!parsed.success) return { ok: false, errors: mapSchemaIssues(parsed.error.issues) };
  return { ok: true, intake: parsed.data };
}

interface SchemaIssue {
  path: readonly PropertyKey[];
  message: string;
}

function codeFor(message: string): FieldError {
  switch (message) {
    case SCHEMA_ISSUES.futureDate:
      return "futureDate";
    case SCHEMA_ISSUES.tooOldDate:
      return "tooOld";
    case SCHEMA_ISSUES.companyRequired:
      return "required";
    case SCHEMA_ISSUES.listedPrice:
      return "listedNotLess";
    case SCHEMA_ISSUES.reservedText:
      return "reservedText";
    default:
      return "invalid";
  }
}

/** Maps core schema issues onto form fields. An issue that is not about a form field lands on the first field. */
export function mapSchemaIssues(issues: readonly SchemaIssue[]): FormErrors {
  const errors: FormErrors = {};
  for (const issue of issues) {
    const head = issue.path[0];
    const name = FIELD_NAMES.find((candidate) => candidate === head) ?? "platform";
    if (errors[name] === undefined) errors[name] = codeFor(issue.message);
  }
  return errors;
}
