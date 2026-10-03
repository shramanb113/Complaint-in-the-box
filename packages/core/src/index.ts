export { generatePacket } from "./generatePacket";
export {
  createIntakeSchema,
  IntakeSchema,
  isNotFutureIsoDate,
  TemplateIdSchema,
  PlatformSchema,
  CategorySchema,
  DesiredRemedySchema,
  LocaleSchema,
  MAX_AMOUNT_INR,
  MIN_ISO_DATE,
  SCHEMA_ISSUES,
} from "./schema";
export { TEMPLATE_CATEGORY } from "./templateCategory";
export { loadCompanyCatalog } from "./companies";
export { REMEDY_TEXT } from "./remedyText";
export { UTR_TOKEN, normalizeUtr, applyUtr } from "./utr";
export {
  nowToIstYMD,
  computeDeadlineYMD,
  addDaysToYMD,
  ymdFromISODate,
  ymdToIsoDate,
  formatYMDEn,
  formatYMDHi,
  type YMD,
} from "./dates";
export { formatInr, formatInrNumber } from "./money";
export { packetDeadline } from "./packetDeadline";
export type {
  Locale,
  Category,
  TemplateId,
  Platform,
  DesiredRemedy,
  Intake,
  CompanyInfo,
  CompanyCatalog,
  Packet,
} from "./types";
export {
  FilingFactsSchema,
  EVIDENCE_KEYS,
  EVIDENCE_TITLE,
  FORUM_NAME,
  READINESS_MESSAGES,
  suggestForum,
  checkFilingReadiness,
  buildNchBlock,
  buildFilingKit,
  type FilingFacts,
  type FilingKit,
  type EvidenceKey,
  type Forum,
  type Readiness,
  type ReadinessCode,
  type ReadinessIssue,
  type Row,
  type KitDocument,
} from "./filing";
