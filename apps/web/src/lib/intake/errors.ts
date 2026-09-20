import { fill } from "@/lib/i18n/define";
import type { IntakeStrings } from "@/lib/i18n/messages/intake";
import { LIMITS, type FieldError, type FieldName } from "./fields";

/** The plain-language text for one field error, with that field's character limits filled in. */
export function errorMessage(code: FieldError, field: FieldName, strings: IntakeStrings): string {
  const limits: Partial<Record<FieldName, { min?: number; max?: number }>> = LIMITS;
  const { min, max } = limits[field] ?? {};
  return fill(strings.errors[code], { ...(min !== undefined && { min }), ...(max !== undefined && { max }) });
}
