# Phase 0 — Core Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/core` — the pure, testable letter-generation engine (schemas, template slot-filling, `generatePacket`) for 2 of the 10 launch templates, with zero UI, so the founder can verify the product's core idea (fact-in, complaint-packet-out) before any web app work starts.

**Architecture:** A TypeScript library with no framework dependency. Zod validates intake at the boundary; `generatePacket` is a pure function that loads human-editable Markdown template files (`{{slot}}` placeholders), fills them from the validated intake, and returns a fully-formed `Packet` object (WhatsApp text, email, NCH/bank field maps, next steps) in both English and Hindi. No LLM, no network calls, no database.

**Tech Stack:** TypeScript, Zod, Vitest, `ulid`, npm workspaces. No date library — Asia/Kolkata has no DST, so date math is done with a fixed +5:30 offset (see Task 3).

**Spec:** `PRD-complaint-in-a-box.md` (v0.2) — primarily §8 (domain model), §9 F3–F4 (template engine, company catalog), §10 T1 & T6 (copy contracts), §11 (LLM rules — not built in this phase, but nothing here may block it), §13 (folder layout), §14 Phase 0, §16 (fixture).

## Global Constraints

- Every user-visible string must exist in **en** and **hi** (PRD §0.3) — both languages ship together in this phase, not as a follow-up.
- Never invent facts: `generatePacket` must not fabricate order IDs, amounts, dates, or names — missing fields become explicit placeholders like `[ORDER ID NOT PROVIDED — attach screenshot]`, never silent invention (PRD §9 F3, §11).
- Slot-fill first, no LLM required for a valid packet (PRD §9 F3).
- WhatsApp artifact ≤ 700 characters; email body 180–350 words (PRD §10).
- Deadline date is computed from **today** + `deadlineDays`, in Asia/Kolkata, not from `paidOn` (PRD §9 F3).
- UTR is never persisted — `generatePacket` must strip `utr` from the `Packet.intake` it returns (PRD §0.7, §8.3).
- Do not allege fraud or invent a penalty amount; phrase RBI/NPCI language as "as per applicable RBI / NPCI turnaround times," never a specific penalty (PRD §10 T6).
- Snapshot/fixture tests are required per template × per language; changing a template's rendered output without updating tests must fail the test run (PRD §9 F3 AC).

---

## File Structure

```
package.json                          # npm workspaces root
packages/core/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    types.ts                          # Locale, Category, TemplateId, Platform, DesiredRemedy, Intake, Packet, CompanyCatalog
    schema.ts                         # Zod IntakeSchema
    dates.ts                          # YMD type, IST-safe date math, en/hi month formatting
    money.ts                          # formatInrNumber, formatInr
    remedyText.ts                     # DesiredRemedy -> {en, hi} phrase map
    templateLoader.ts                 # parseTemplateMarkdown, fillSlots, loadTemplateFile
    companies.ts                      # loadCompanyCatalog (reads data/companies.json)
    generatePacket.ts                 # generatePacket(intake, catalog, now?) -> Packet
    cli.ts                            # prints the §16 fixture's WhatsApp text to stdout
  data/
    companies.json                    # flipkart, gpay (minimal catalog for this phase's fixtures)
    templates/
      ecom_wrong_item.en.md
      ecom_wrong_item.hi.md
      upi_debit_merchant_no_credit.en.md
      upi_debit_merchant_no_credit.hi.md
  test/
    schema.test.ts
    dates.test.ts
    templateLoader.test.ts
    companies.test.ts
    generatePacket.test.ts
```

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json` (repo root)
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `.gitignore`

**Interfaces:**
- Produces: an npm workspace where `npm test` (root) and `npm test -w @nyaypatra/core` both run Vitest for `packages/core`, currently with zero test files.

- [ ] **Step 1: Initialize git and root workspace**

```bash
git init
```

Create `D:\Play-About-Around-Folder\Complaint-in-a-box\.gitignore`:

```
node_modules/
dist/
.env
.env.local
```

Create `D:\Play-About-Around-Folder\Complaint-in-a-box\package.json`:

```json
{
  "name": "nyaypatra",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "test": "npm run test --workspaces --if-present"
  }
}
```

- [ ] **Step 2: Create `packages/core/package.json`**

```json
{
  "name": "@nyaypatra/core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "print:fixture": "tsx src/cli.ts"
  },
  "dependencies": {
    "zod": "^3.23.8",
    "ulid": "^2.3.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^2.0.5",
    "tsx": "^4.16.2",
    "@types/node": "^20.14.0"
  }
}
```

- [ ] **Step 3: Create `packages/core/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 4: Create `packages/core/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 5: Install and verify**

Run: `npm install`
Expected: installs without error, creates root `node_modules/` and `package-lock.json`.

Run: `npm test -w @nyaypatra/core`
Expected: Vitest runs and reports "No test files found" (exit code may be non-zero here — that's expected since there are no tests yet; the goal of this step is confirming Vitest itself launches, not that it passes).

- [ ] **Step 6: Commit**

```bash
git add package.json packages/core/package.json packages/core/tsconfig.json packages/core/vitest.config.ts .gitignore
git commit -m "chore: scaffold npm workspace and @nyaypatra/core package"
```

---

### Task 2: Domain types and Zod schema

**Files:**
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/schema.ts`
- Test: `packages/core/test/schema.test.ts`

**Interfaces:**
- Produces: `Locale`, `Category`, `TemplateId`, `Platform`, `DesiredRemedy`, `Intake`, `CompanyInfo`, `CompanyCatalog`, `Packet` types (from `types.ts`); `IntakeSchema: z.ZodType<Intake>` (from `schema.ts`).

- [ ] **Step 1: Write the failing test**

Create `packages/core/test/schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { IntakeSchema } from "../src/schema";

const baseIntake = {
  category: "ecommerce" as const,
  templateId: "ecom_wrong_item" as const,
  locale: "en" as const,
  platform: "flipkart" as const,
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "Wrong mixer delivered, cracked blade on arrival.",
  desiredRemedy: "pickup_and_refund" as const,
  deadlineDays: 7 as const,
};

describe("IntakeSchema", () => {
  it("accepts a valid intake", () => {
    expect(() => IntakeSchema.parse(baseIntake)).not.toThrow();
  });

  it("rejects amountInr <= 0", () => {
    expect(() => IntakeSchema.parse({ ...baseIntake, amountInr: 0 })).toThrow();
  });

  it("rejects whatHappened shorter than 20 characters", () => {
    expect(() => IntakeSchema.parse({ ...baseIntake, whatHappened: "too short" })).toThrow();
  });

  it("rejects a future paidOn date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const isoFuture = future.toISOString().slice(0, 10);
    expect(() => IntakeSchema.parse({ ...baseIntake, paidOn: isoFuture })).toThrow();
  });

  it("requires companyName when platform is 'other'", () => {
    expect(() =>
      IntakeSchema.parse({ ...baseIntake, platform: "other", companyName: undefined })
    ).toThrow();
    expect(() =>
      IntakeSchema.parse({ ...baseIntake, platform: "other", companyName: "Local Kirana Store" })
    ).not.toThrow();
  });

  it("rejects an unknown desiredRemedy value", () => {
    expect(() =>
      IntakeSchema.parse({ ...baseIntake, desiredRemedy: "give_me_everything" })
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @nyaypatra/core`
Expected: FAIL — `Cannot find module '../src/schema'` (file doesn't exist yet).

- [ ] **Step 3: Write `packages/core/src/types.ts`**

```typescript
export type Locale = "en" | "hi" | "both";

export type Category = "ecommerce" | "upi" | "food" | "hidden_fee";

export type TemplateId =
  | "ecom_wrong_item"
  | "ecom_not_delivered"
  | "ecom_damaged"
  | "ecom_refund_to_wallet"
  | "ecom_seller_ghosted"
  | "upi_debit_merchant_no_credit"
  | "upi_double_debit"
  | "food_missing_item"
  | "food_wrong_item"
  | "fee_drip_pricing";

export type Platform =
  | "flipkart"
  | "amazon"
  | "meesho"
  | "myntra"
  | "ajio"
  | "zepto"
  | "blinkit"
  | "swiggy"
  | "zomato"
  | "gpay"
  | "phonepe"
  | "paytm"
  | "other";

export type DesiredRemedy =
  | "full_refund_original_mode"
  | "replacement"
  | "pickup_and_refund"
  | "reverse_failed_upi"
  | "remove_hidden_fee";

export interface Intake {
  category: Category;
  templateId: TemplateId;
  locale: Locale;
  platform: Platform;
  companyName?: string;
  orderId?: string;
  utr?: string;
  amountInr: number;
  paidOn: string;
  deliveredOn?: string;
  issueOn?: string;
  city?: string;
  state?: string;
  whatHappened: string;
  alreadyDid?: string;
  desiredRemedy: DesiredRemedy;
  deadlineDays: 2 | 7 | 15;
  userDisplayName?: string;
}

export interface CompanyInfo {
  legalName: string;
  grievanceUrl: string;
  nchCompanyHint: string;
  chatHint: string;
}

export type CompanyCatalog = Record<string, CompanyInfo>;

export interface Packet {
  id: string;
  createdAt: string;
  intake: Omit<Intake, "utr">;
  artifacts: {
    whatsapp: { en: string; hi: string };
    emailSubject: { en: string; hi: string };
    emailBody: { en: string; hi: string };
    nchFields: Record<string, string>;
    bankFields?: Record<string, string>;
    portalLinks: { label: string; href: string; help: string }[];
    nextSteps: { en: string[]; hi: string[] };
  };
}
```

- [ ] **Step 4: Write `packages/core/src/schema.ts`**

```typescript
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -w @nyaypatra/core`
Expected: PASS — all 6 tests in `schema.test.ts` green.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/schema.ts packages/core/test/schema.test.ts
git commit -m "feat(core): add domain types and Zod IntakeSchema"
```

---

### Task 3: Date and money utilities

**Files:**
- Create: `packages/core/src/dates.ts`
- Create: `packages/core/src/money.ts` (no dedicated test file — trivial formatting, exercised indirectly by `generatePacket.test.ts` in Task 8)
- Test: `packages/core/test/dates.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `YMD` type, `ymdFromISODate(iso: string): YMD`, `nowToIstYMD(now?: Date): YMD`, `addDaysToYMD(ymd: YMD, days: number): YMD`, `computeDeadlineYMD(deadlineDays: number, now?: Date): YMD`, `formatYMDEn(ymd: YMD): string`, `formatYMDHi(ymd: YMD): string` (from `dates.ts`); `formatInrNumber(n: number): string`, `formatInr(n: number): string` (from `money.ts`). Task 9 (`generatePacket.ts`) depends on all of these exact names.

- [ ] **Step 1: Write the failing test**

Create `packages/core/test/dates.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  ymdFromISODate,
  nowToIstYMD,
  addDaysToYMD,
  computeDeadlineYMD,
  formatYMDEn,
  formatYMDHi,
} from "../src/dates";

describe("dates", () => {
  it("parses an ISO date into a YMD", () => {
    expect(ymdFromISODate("2026-09-10")).toEqual({ y: 2026, m: 9, d: 10 });
  });

  it("formats a YMD in English", () => {
    expect(formatYMDEn({ y: 2026, m: 9, d: 10 })).toBe("10 Sep 2026");
  });

  it("formats a YMD in Hindi", () => {
    expect(formatYMDHi({ y: 2026, m: 9, d: 10 })).toBe("10 सितंबर 2026");
  });

  it("adds days across a month boundary", () => {
    expect(addDaysToYMD({ y: 2026, m: 9, d: 28 }, 5)).toEqual({ y: 2026, m: 10, d: 3 });
  });

  it("reads the IST calendar date from a UTC instant near the IST midnight boundary", () => {
    // 2026-09-15T19:00:00Z = 2026-09-16T00:30 IST — already the next day in IST
    const now = new Date("2026-09-15T19:00:00Z");
    expect(nowToIstYMD(now)).toEqual({ y: 2026, m: 9, d: 16 });
  });

  it("computes a deadline as now + deadlineDays in IST, not paidOn + deadlineDays", () => {
    const now = new Date("2026-09-15T12:00:00Z"); // 2026-09-15 17:30 IST
    expect(computeDeadlineYMD(7, now)).toEqual({ y: 2026, m: 9, d: 22 });
    expect(computeDeadlineYMD(2, now)).toEqual({ y: 2026, m: 9, d: 17 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @nyaypatra/core`
Expected: FAIL — `Cannot find module '../src/dates'`.

- [ ] **Step 3: Write `packages/core/src/dates.ts`**

```typescript
export interface YMD {
  y: number;
  m: number; // 1-indexed
  d: number;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const HI_MONTHS = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

export function ymdFromISODate(iso: string): YMD {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** India has no DST, so a fixed +5:30 offset is always correct. */
export function nowToIstYMD(now: Date = new Date()): YMD {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

export function addDaysToYMD(ymd: YMD, days: number): YMD {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function computeDeadlineYMD(deadlineDays: number, now: Date = new Date()): YMD {
  return addDaysToYMD(nowToIstYMD(now), deadlineDays);
}

export function formatYMDEn(ymd: YMD): string {
  return `${ymd.d} ${EN_MONTHS[ymd.m - 1]} ${ymd.y}`;
}

export function formatYMDHi(ymd: YMD): string {
  return `${ymd.d} ${HI_MONTHS[ymd.m - 1]} ${ymd.y}`;
}
```

- [ ] **Step 4: Write `packages/core/src/money.ts`** (no test-first needed — trivial formatting, covered indirectly by `generatePacket.test.ts` in Task 9; write it now since Task 9 depends on its exact export names)

```typescript
export function formatInrNumber(amountInr: number): string {
  return amountInr.toLocaleString("en-IN");
}

export function formatInr(amountInr: number): string {
  return "₹" + formatInrNumber(amountInr);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -w @nyaypatra/core`
Expected: PASS — all 6 tests in `dates.test.ts` green (plus the earlier 6 `schema.test.ts` tests still passing).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/dates.ts packages/core/src/money.ts packages/core/test/dates.test.ts
git commit -m "feat(core): add IST-safe date math and INR formatting"
```

---

### Task 4: Remedy text map and company catalog loader

**Files:**
- Create: `packages/core/src/remedyText.ts`
- Create: `packages/core/src/companies.ts`
- Create: `packages/core/data/companies.json`
- Test: `packages/core/test/companies.test.ts`

**Interfaces:**
- Consumes: `CompanyCatalog` type from `types.ts` (Task 2).
- Produces: `REMEDY_TEXT: Record<DesiredRemedy, { en: string; hi: string }>` (from `remedyText.ts`); `loadCompanyCatalog(): CompanyCatalog` (from `companies.ts`). Task 9 depends on both exact names.

- [ ] **Step 1: Write the failing test**

Create `packages/core/test/companies.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { loadCompanyCatalog } from "../src/companies";

describe("loadCompanyCatalog", () => {
  it("loads flipkart and gpay entries with all required fields", () => {
    const catalog = loadCompanyCatalog();
    expect(catalog.flipkart.legalName).toBe("Flipkart Internet Private Limited");
    expect(catalog.flipkart.grievanceUrl).toMatch(/^https:\/\//);
    expect(catalog.gpay.legalName).toBe("Google Pay");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @nyaypatra/core`
Expected: FAIL — `Cannot find module '../src/companies'`.

- [ ] **Step 3: Write `packages/core/src/remedyText.ts`**

```typescript
import type { DesiredRemedy } from "./types";

export const REMEDY_TEXT: Record<DesiredRemedy, { en: string; hi: string }> = {
  full_refund_original_mode: {
    en: "a full refund to my original payment mode",
    hi: "मेरे मूल भुगतान माध्यम में पूरा रिफंड",
  },
  replacement: {
    en: "a replacement item",
    hi: "सामान की जगह नया सामान (रिप्लेसमेंट)",
  },
  pickup_and_refund: {
    en: "pickup of the wrong item and a full refund to the original payment mode",
    hi: "गलत सामान की पिकअप और मूल भुगतान माध्यम में पूरा रिफंड",
  },
  reverse_failed_upi: {
    en: "the amount to be reversed/credited back to my account",
    hi: "राशि मेरे खाते में वापस जमा/रिवर्स की जाए",
  },
  remove_hidden_fee: {
    en: "a refund of the hidden charges and removal of the extra fee",
    hi: "छुपे हुए शुल्क की वापसी और अतिरिक्त शुल्क को हटाना",
  },
};
```

- [ ] **Step 4: Create `packages/core/data/companies.json`**

```json
{
  "flipkart": {
    "legalName": "Flipkart Internet Private Limited",
    "grievanceUrl": "https://www.flipkart.com/helpcentre",
    "nchCompanyHint": "Flipkart",
    "chatHint": "Use in-app chat → Help Centre"
  },
  "gpay": {
    "legalName": "Google Pay",
    "grievanceUrl": "https://support.google.com/pay/india/",
    "nchCompanyHint": "Google Pay",
    "chatHint": "Use in-app Help → Get support"
  }
}
```

- [ ] **Step 5: Write `packages/core/src/companies.ts`**

```typescript
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CompanyCatalog } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadCompanyCatalog(): CompanyCatalog {
  const raw = readFileSync(join(__dirname, "..", "data", "companies.json"), "utf-8");
  return JSON.parse(raw) as CompanyCatalog;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -w @nyaypatra/core`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/remedyText.ts packages/core/src/companies.ts packages/core/data/companies.json packages/core/test/companies.test.ts
git commit -m "feat(core): add remedy text map and minimal company catalog"
```

---

### Task 5: Template loader (Markdown parsing + slot filling)

**Files:**
- Create: `packages/core/src/templateLoader.ts`
- Test: `packages/core/test/templateLoader.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `TemplateSections { whatsapp: string; email_subject: string; email_body: string }`, `parseTemplateMarkdown(raw: string): TemplateSections`, `fillSlots(text: string, slots: Record<string, string>): string`, `loadTemplateFile(templateId: string, locale: "en" | "hi"): TemplateSections`. Task 9 depends on all four exact names.

- [ ] **Step 1: Write the failing test**

Create `packages/core/test/templateLoader.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseTemplateMarkdown, fillSlots } from "../src/templateLoader";

describe("parseTemplateMarkdown", () => {
  it("splits a template file into its three named sections", () => {
    const raw = `## whatsapp
Hello {{name}}.

## email_subject
Subject line

## email_body
Dear {{name}},
Body text.
`;
    const sections = parseTemplateMarkdown(raw);
    expect(sections.whatsapp).toBe("Hello {{name}}.");
    expect(sections.email_subject).toBe("Subject line");
    expect(sections.email_body).toBe("Dear {{name}},\nBody text.");
  });

  it("throws if a required section is missing", () => {
    expect(() => parseTemplateMarkdown("## whatsapp\nOnly this section.")).toThrow();
  });
});

describe("fillSlots", () => {
  it("replaces every {{slot}} with its value", () => {
    expect(fillSlots("Hi {{name}}, you paid {{amount}}.", { name: "Priya", amount: "500" })).toBe(
      "Hi Priya, you paid 500."
    );
  });

  it("throws if a slot has no provided value", () => {
    expect(() => fillSlots("Hi {{name}}.", {})).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @nyaypatra/core`
Expected: FAIL — `Cannot find module '../src/templateLoader'`.

- [ ] **Step 3: Write `packages/core/src/templateLoader.ts`**

```typescript
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface TemplateSections {
  whatsapp: string;
  email_subject: string;
  email_body: string;
}

const REQUIRED_SECTIONS: (keyof TemplateSections)[] = ["whatsapp", "email_subject", "email_body"];

export function parseTemplateMarkdown(raw: string): TemplateSections {
  const sections: Record<string, string> = {};
  const parts = raw.split(/^##\s+(\w+)\s*$/m).slice(1);
  for (let i = 0; i < parts.length; i += 2) {
    const key = parts[i].trim();
    const body = parts[i + 1].trim();
    sections[key] = body;
  }
  for (const key of REQUIRED_SECTIONS) {
    if (!sections[key]) {
      throw new Error(`Template markdown missing required section "## ${key}"`);
    }
  }
  return sections as unknown as TemplateSections;
}

export function fillSlots(text: string, slots: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in slots)) {
      throw new Error(`Missing slot value for {{${key}}}`);
    }
    return slots[key];
  });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "data", "templates");

export function loadTemplateFile(templateId: string, locale: "en" | "hi"): TemplateSections {
  const path = join(TEMPLATES_DIR, `${templateId}.${locale}.md`);
  const raw = readFileSync(path, "utf-8");
  return parseTemplateMarkdown(raw);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w @nyaypatra/core`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/templateLoader.ts packages/core/test/templateLoader.test.ts
git commit -m "feat(core): add Markdown template parser and slot-filling engine"
```

---

### Task 6: `ecom_wrong_item` template content (en + hi)

**Files:**
- Create: `packages/core/data/templates/ecom_wrong_item.en.md`
- Create: `packages/core/data/templates/ecom_wrong_item.hi.md`
- Test: `packages/core/test/templateLoader.test.ts` (extend)

**Interfaces:**
- Consumes: `loadTemplateFile` from Task 5.
- Produces: parseable template files for `templateId: "ecom_wrong_item"`. Task 9's fixture test depends on the exact slot names used here: `{{orderId}}`, `{{platformName}}`, `{{companyName}}`, `{{amountInr}}`, `{{paidOnFormatted}}`, `{{deliveredOnFormatted}}`, `{{whatHappened}}`, `{{alreadyDidLine}}`, `{{remedyText}}`, `{{deadlineFormatted}}`.

- [ ] **Step 1: Write the failing test**

Add to `packages/core/test/templateLoader.test.ts`:

```typescript
import { loadTemplateFile } from "../src/templateLoader";

describe("loadTemplateFile - ecom_wrong_item", () => {
  it("loads and parses both language files without throwing", () => {
    expect(() => loadTemplateFile("ecom_wrong_item", "en")).not.toThrow();
    expect(() => loadTemplateFile("ecom_wrong_item", "hi")).not.toThrow();
  });

  it("the English WhatsApp section fits within 700 characters once a typical fixture is substituted", () => {
    const sections = loadTemplateFile("ecom_wrong_item", "en");
    // static text length only — full slot-filled length is asserted in generatePacket.test.ts
    expect(sections.whatsapp.length).toBeLessThan(700);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @nyaypatra/core`
Expected: FAIL — `ENOENT` reading `ecom_wrong_item.en.md` (file doesn't exist).

- [ ] **Step 3: Write `packages/core/data/templates/ecom_wrong_item.en.md`**

```markdown
## whatsapp
Order {{orderId}}, {{platformName}}, paid ₹{{amountInr}} on {{paidOnFormatted}}.
Delivered {{deliveredOnFormatted}}: {{whatHappened}}
{{alreadyDidLine}}

I want {{remedyText}}.

Please confirm in writing by {{deadlineFormatted}}.
If unresolved I will file on the National Consumer Helpline (1915) and pursue remedies under the Consumer Protection Act, 2019.

## email_subject
Wrong item received — Order {{orderId}}, resolution requested by {{deadlineFormatted}}

## email_body
Dear {{companyName}} Grievance Team,

I am writing regarding Order {{orderId}}, placed on {{platformName}} and paid ₹{{amountInr}} on {{paidOnFormatted}}.

The order was delivered on {{deliveredOnFormatted}}. However, the item delivered does not match what was listed and ordered: {{whatHappened}}

{{alreadyDidLine}}

Under the Consumer Protection Act, 2019, delivering an item that does not match its description is a deficiency in service and an unfair trade practice. I am requesting {{remedyText}}.

Please confirm this in writing and complete the resolution by {{deadlineFormatted}}. If I do not receive a satisfactory response by this date, I will escalate this complaint to the National Consumer Helpline (1915) and pursue the remedies available to me under the Consumer Protection Act, 2019, including filing with the Consumer Commission.

I can provide order confirmation and delivery details on request.

Regards,
{{userDisplayName}}
{{city}}
```

- [ ] **Step 4: Write `packages/core/data/templates/ecom_wrong_item.hi.md`**

```markdown
## whatsapp
ऑर्डर {{orderId}}, {{platformName}}, ₹{{amountInr}} का भुगतान {{paidOnFormatted}} को किया गया।
डिलीवरी {{deliveredOnFormatted}}: {{whatHappened}}
{{alreadyDidLine}}

मुझे {{remedyText}} चाहिए।

कृपया {{deadlineFormatted}} तक लिखित में पुष्टि करें।
यदि समाधान नहीं हुआ तो मैं नेशनल कंज्यूमर हेल्पलाइन (1915) पर शिकायत दर्ज करूंगा/करूंगी और उपभोक्ता संरक्षण अधिनियम, 2019 के तहत उपलब्ध उपायों का उपयोग करूंगा/करूंगी।

## email_subject
गलत सामान प्राप्त हुआ — ऑर्डर {{orderId}}, {{deadlineFormatted}} तक समाधान का अनुरोध

## email_body
प्रिय {{companyName}} शिकायत टीम,

मैं ऑर्डर {{orderId}} के संबंध में लिख रहा/रही हूं, जो {{platformName}} पर दिया गया था और जिसका भुगतान ₹{{amountInr}} {{paidOnFormatted}} को किया गया था।

यह ऑर्डर {{deliveredOnFormatted}} को डिलीवर हुआ। हालांकि, डिलीवर किया गया सामान सूचीबद्ध और ऑर्डर किए गए सामान से मेल नहीं खाता: {{whatHappened}}

{{alreadyDidLine}}

उपभोक्ता संरक्षण अधिनियम, 2019 के तहत, सूची से अलग सामान डिलीवर करना सेवा में कमी और एक अनुचित व्यापार प्रथा है। मैं {{remedyText}} का अनुरोध करता/करती हूं।

कृपया इसकी लिखित पुष्टि करें और {{deadlineFormatted}} तक समाधान पूरा करें। यदि मुझे इस तिथि तक संतोषजनक उत्तर नहीं मिलता है, तो मैं इस शिकायत को नेशनल कंज्यूमर हेल्पलाइन (1915) पर आगे बढ़ाऊंगा/बढ़ाऊंगी और उपभोक्ता संरक्षण अधिनियम, 2019 के तहत उपलब्ध उपायों का उपयोग करूंगा/करूंगी, जिसमें उपभोक्ता आयोग में शिकायत दर्ज करना शामिल है।

मैं अनुरोध पर ऑर्डर पुष्टिकरण और डिलीवरी विवरण प्रदान कर सकता/सकती हूं।

सादर,
{{userDisplayName}}
{{city}}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -w @nyaypatra/core`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/data/templates/ecom_wrong_item.en.md packages/core/data/templates/ecom_wrong_item.hi.md packages/core/test/templateLoader.test.ts
git commit -m "feat(core): add ecom_wrong_item template copy (en + hi)"
```

---

### Task 7: `upi_debit_merchant_no_credit` template content (en + hi)

**Files:**
- Create: `packages/core/data/templates/upi_debit_merchant_no_credit.en.md`
- Create: `packages/core/data/templates/upi_debit_merchant_no_credit.hi.md`
- Test: `packages/core/test/templateLoader.test.ts` (extend)

**Interfaces:**
- Consumes: `loadTemplateFile` from Task 5.
- Produces: parseable template files for `templateId: "upi_debit_merchant_no_credit"`. Additionally uses slot `{{utrLine}}` beyond the set from Task 6 — Task 9 depends on this exact name.

- [ ] **Step 1: Write the failing test**

Add to `packages/core/test/templateLoader.test.ts`:

```typescript
describe("loadTemplateFile - upi_debit_merchant_no_credit", () => {
  it("loads and parses both language files without throwing", () => {
    expect(() => loadTemplateFile("upi_debit_merchant_no_credit", "en")).not.toThrow();
    expect(() => loadTemplateFile("upi_debit_merchant_no_credit", "hi")).not.toThrow();
  });

  it("mentions RBI/NPCI turnaround times, never a specific penalty amount", () => {
    const sections = loadTemplateFile("upi_debit_merchant_no_credit", "en");
    expect(sections.email_body).toMatch(/RBI \/ NPCI turnaround times/);
    expect(sections.whatsapp + sections.email_body).not.toMatch(/penalty/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @nyaypatra/core`
Expected: FAIL — `ENOENT` reading `upi_debit_merchant_no_credit.en.md`.

- [ ] **Step 3: Write `packages/core/data/templates/upi_debit_merchant_no_credit.en.md`**

```markdown
## whatsapp
UPI payment of ₹{{amountInr}} was debited from my account on {{paidOnFormatted}} via {{platformName}} to {{companyName}}{{utrLine}}.
The amount was debited but the recipient has not confirmed receipt, and I have not received the goods/service or a refund.

I want {{remedyText}}.

Please investigate and reverse/credit this amount by {{deadlineFormatted}}, as per applicable RBI / NPCI turnaround times for failed or unconfirmed transactions.
If unresolved I will escalate to the RBI Banking Ombudsman / Complaint Management System (CMS).

## email_subject
Failed/unconfirmed UPI transaction — ₹{{amountInr}} debited {{paidOnFormatted}}, resolution requested by {{deadlineFormatted}}

## email_body
Dear {{companyName}} / Bank Grievance Team,

On {{paidOnFormatted}}, an amount of ₹{{amountInr}} was debited from my account via UPI ({{platformName}}) intended for {{companyName}}{{utrLine}}.

The amount was debited from my account, but the recipient has not confirmed receipt and I have not received the goods/service, nor has the amount been refunded or reversed to my account.

As per applicable RBI / NPCI turnaround times for failed or unconfirmed UPI transactions, I am requesting {{remedyText}} at the earliest, and in any case by {{deadlineFormatted}}.

If this is not resolved by the above date, I will escalate this complaint to the RBI Banking Ombudsman through the Complaint Management System (CMS), and pursue the remedies available under the Consumer Protection Act, 2019.

Please treat this as a formal request for investigation and resolution. I can provide my bank statement and transaction screenshot on request.

Regards,
{{userDisplayName}}
{{city}}
```

- [ ] **Step 4: Write `packages/core/data/templates/upi_debit_merchant_no_credit.hi.md`**

```markdown
## whatsapp
₹{{amountInr}} का UPI भुगतान {{paidOnFormatted}} को मेरे खाते से {{platformName}} के माध्यम से {{companyName}} को किया गया{{utrLine}}।
राशि डेबिट हो गई है, लेकिन प्राप्तकर्ता ने इसकी प्राप्ति की पुष्टि नहीं की है, और मुझे न तो सामान/सेवा मिली है और न ही रिफंड।

मुझे {{remedyText}} चाहिए।

कृपया लागू RBI / NPCI टर्नअराउंड समय के अनुसार, {{deadlineFormatted}} तक इसकी जांच करें और राशि वापस/जमा करें।
यदि समाधान नहीं हुआ तो मैं RBI बैंकिंग लोकपाल / शिकायत प्रबंधन प्रणाली (CMS) में शिकायत दर्ज करूंगा/करूंगी।

## email_subject
असफल/अपुष्ट UPI लेनदेन — ₹{{amountInr}} {{paidOnFormatted}} को डेबिट, {{deadlineFormatted}} तक समाधान का अनुरोध

## email_body
प्रिय {{companyName}} / बैंक शिकायत टीम,

{{paidOnFormatted}} को, मेरे खाते से UPI ({{platformName}}) के माध्यम से ₹{{amountInr}} की राशि {{companyName}} के लिए डेबिट हुई{{utrLine}}।

राशि मेरे खाते से डेबिट हो गई है, लेकिन प्राप्तकर्ता ने प्राप्ति की पुष्टि नहीं की है और मुझे न तो सामान/सेवा मिली है, न ही राशि वापस/जमा हुई है।

असफल या अपुष्ट UPI लेनदेन के लिए लागू RBI / NPCI टर्नअराउंड समय के अनुसार, मैं {{remedyText}} का अनुरोध करता/करती हूं, और किसी भी स्थिति में {{deadlineFormatted}} तक।

यदि उपरोक्त तिथि तक इसका समाधान नहीं होता है, तो मैं इस शिकायत को शिकायत प्रबंधन प्रणाली (CMS) के माध्यम से RBI बैंकिंग लोकपाल तक बढ़ाऊंगा/बढ़ाऊंगी, और उपभोक्ता संरक्षण अधिनियम, 2019 के तहत उपलब्ध उपायों का उपयोग करूंगा/करूंगी।

कृपया इसे जांच और समाधान के लिए एक औपचारिक अनुरोध मानें। मैं अनुरोध पर अपना बैंक स्टेटमेंट और लेनदेन का स्क्रीनशॉट प्रदान कर सकता/सकती हूं।

सादर,
{{userDisplayName}}
{{city}}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -w @nyaypatra/core`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/data/templates/upi_debit_merchant_no_credit.en.md packages/core/data/templates/upi_debit_merchant_no_credit.hi.md packages/core/test/templateLoader.test.ts
git commit -m "feat(core): add upi_debit_merchant_no_credit template copy (en + hi)"
```

---

### Task 8: `generatePacket` — assembly logic and full fixture tests

**Files:**
- Create: `packages/core/src/generatePacket.ts`
- Test: `packages/core/test/generatePacket.test.ts`

**Interfaces:**
- Consumes: `Intake`, `Packet`, `CompanyCatalog` (Task 2); `computeDeadlineYMD`, `ymdFromISODate`, `formatYMDEn`, `formatYMDHi`, `YMD` (Task 3); `formatInr`, `formatInrNumber` (Task 3); `REMEDY_TEXT` (Task 4); `loadCompanyCatalog` (Task 4); `loadTemplateFile`, `fillSlots` (Task 5); the two template files from Tasks 6–7.
- Produces: `generatePacket(intake: Intake, catalog: CompanyCatalog, now?: Date): Packet`. This is the package's public entry point — Task 9's CLI depends on this exact signature.

- [ ] **Step 1: Write the failing test**

Create `packages/core/test/generatePacket.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generatePacket } from "../src/generatePacket";
import { loadCompanyCatalog } from "../src/companies";
import type { Intake } from "../src/types";

const catalog = loadCompanyCatalog();
const FIXED_NOW = new Date("2026-09-15T12:00:00Z"); // 2026-09-15 17:30 IST

// PRD §16 fixture
const ecomFixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_wrong_item",
  locale: "en",
  platform: "flipkart",
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "wrong mixer, cracked blade",
  alreadyDid: "raised in-app ticket",
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

describe("generatePacket - ecom_wrong_item", () => {
  it("includes all required facts in the English WhatsApp text, within 700 characters", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    const wa = packet.artifacts.whatsapp.en;
    expect(wa).toContain("OD123");
    expect(wa).toContain("₹2,499");
    expect(wa).toContain("10 Sep 2026");
    expect(wa).toContain("14 Sep 2026");
    expect(wa).toContain("wrong mixer, cracked blade");
    expect(wa).toContain("pickup of the wrong item and a full refund");
    expect(wa).toContain("22 Sep 2026"); // deadline = now (15 Sep) + 7 days, not paidOn + 7
    expect(wa.length).toBeLessThanOrEqual(700);
  });

  it("produces a complete Hindi WhatsApp text with no unfilled slots", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.hi).not.toMatch(/\{\{/);
    expect(packet.artifacts.whatsapp.hi).toContain("OD123");
    expect(packet.artifacts.whatsapp.hi).toContain("10 सितंबर 2026");
  });

  it("produces an email body between roughly 130 and 400 words", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    const wordCount = packet.artifacts.emailBody.en.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(130);
    expect(wordCount).toBeLessThan(400);
  });

  it("strips utr from the stored intake even if it was never set on this template", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.intake).not.toHaveProperty("utr");
  });

  it("includes NCH portal links and nchFields for the ecommerce category", () => {
    const packet = generatePacket(ecomFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.portalLinks.some((l) => l.label.includes("National Consumer Helpline") || l.label.includes("NCH"))).toBe(true);
    expect(packet.artifacts.nchFields["Order / Transaction ID"]).toBe("OD123");
    expect(packet.artifacts.bankFields).toBeUndefined();
  });

  it("falls back to an explicit placeholder when orderId is missing, never inventing one", () => {
    const { orderId, ...withoutOrderId } = ecomFixture;
    const packet = generatePacket(withoutOrderId as Intake, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("[ORDER ID NOT PROVIDED — attach screenshot]");
  });
});

// PRD persona P2 fixture: Ramesh, UPI payment to a carpenter, GPay
const upiFixture: Intake = {
  category: "upi",
  templateId: "upi_debit_merchant_no_credit",
  locale: "en",
  platform: "gpay",
  companyName: "Ramesh's Carpenter",
  amountInr: 8000,
  paidOn: "2026-09-12",
  whatHappened: "Paid the carpenter via GPay but he says he has not received the money.",
  desiredRemedy: "reverse_failed_upi",
  deadlineDays: 2,
};

describe("generatePacket - upi_debit_merchant_no_credit", () => {
  it("includes a UTR placeholder when utr is missing", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("UTR not available");
  });

  it("includes the actual UTR when provided, and still strips it from stored intake", () => {
    const withUtr: Intake = { ...upiFixture, utr: "402812345678" };
    const packet = generatePacket(withUtr, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("402812345678");
    expect(packet.intake).not.toHaveProperty("utr");
  });

  it("separates the payment app (platformName) from the recipient (companyName)", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("via Google Pay");
    expect(packet.artifacts.whatsapp.en).toContain("to Ramesh's Carpenter");
  });

  it("mentions RBI/NPCI turnaround times without inventing a penalty amount", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.emailBody.en).toContain("RBI / NPCI turnaround times");
    expect(packet.artifacts.emailBody.en).not.toMatch(/penalty/i);
  });

  it("includes bankFields and RBI CMS / NPCI portal links for the UPI category", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.bankFields).toBeDefined();
    expect(packet.artifacts.bankFields?.["Amount (INR)"]).toBe("₹8,000");
    expect(packet.artifacts.portalLinks.some((l) => l.label.includes("RBI"))).toBe(true);
  });

  it("computes the 2-day deadline from now, in IST", () => {
    const packet = generatePacket(upiFixture, catalog, FIXED_NOW);
    expect(packet.artifacts.whatsapp.en).toContain("17 Sep 2026");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @nyaypatra/core`
Expected: FAIL — `Cannot find module '../src/generatePacket'`.

- [ ] **Step 3: Write `packages/core/src/generatePacket.ts`**

```typescript
import { ulid } from "ulid";
import type { Intake, Packet, CompanyCatalog } from "./types";
import {
  type YMD,
  computeDeadlineYMD,
  ymdFromISODate,
  formatYMDEn,
  formatYMDHi,
} from "./dates";
import { formatInr, formatInrNumber } from "./money";
import { REMEDY_TEXT } from "./remedyText";
import { loadTemplateFile, fillSlots } from "./templateLoader";

const PORTAL_LINKS_ECOM = [
  {
    label: "National Consumer Helpline (NCH)",
    href: "https://consumerhelpline.gov.in/",
    help: "File a formal consumer complaint online.",
  },
  {
    label: "e-Daakhil / e-Jagriti",
    href: "https://e-daakhil.nic.in/",
    help: "File a case with the Consumer Commission.",
  },
];

const PORTAL_LINKS_UPI = [
  {
    label: "RBI Complaint Management System (CMS)",
    href: "https://cms.rbi.org.in/",
    help: "Escalate to the RBI Banking Ombudsman.",
  },
  {
    label: "NPCI UPI Help",
    href: "https://www.npci.org.in/what-we-do/upi/faqs",
    help: "UPI-specific dispute guidance.",
  },
];

/** The payment app or platform itself — e.g. "Google Pay", "Flipkart Internet Private Limited". */
function appLabel(intake: Intake, catalog: CompanyCatalog): string {
  return catalog[intake.platform]?.legalName ?? intake.platform;
}

/**
 * Who the letter is addressed to. For ecommerce/food, the platform IS the
 * company. For UPI, the platform is just the payment app — the actual
 * recipient (a merchant, a shop, a person) comes from companyName.
 */
function recipientLabel(intake: Intake, catalog: CompanyCatalog): string {
  if (intake.category === "upi") {
    return intake.companyName ?? "the recipient";
  }
  return catalog[intake.platform]?.legalName ?? intake.companyName ?? intake.platform;
}

function buildSlots(intake: Intake, catalog: CompanyCatalog, deadline: YMD) {
  const remedy = REMEDY_TEXT[intake.desiredRemedy];
  const platformName = appLabel(intake, catalog);
  const companyName = recipientLabel(intake, catalog);
  const alreadyDidEn = intake.alreadyDid
    ? `Already tried: ${intake.alreadyDid}. No resolution.`
    : "";
  const alreadyDidHi = intake.alreadyDid
    ? `पहले किया गया प्रयास: ${intake.alreadyDid}। अभी तक समाधान नहीं हुआ।`
    : "";
  const utrLineEn = intake.utr
    ? ` (UTR: ${intake.utr})`
    : " (UTR not available — please locate using amount, date and time)";
  const utrLineHi = intake.utr
    ? ` (UTR: ${intake.utr})`
    : " (UTR उपलब्ध नहीं — कृपया राशि, तिथि और समय के आधार पर खोजें)";
  const paidOnYMD = ymdFromISODate(intake.paidOn);
  const deliveredOnYMD = intake.deliveredOn ? ymdFromISODate(intake.deliveredOn) : null;

  return {
    en: {
      orderId: intake.orderId ?? "[ORDER ID NOT PROVIDED — attach screenshot]",
      platformName,
      companyName,
      amountInr: formatInrNumber(intake.amountInr),
      paidOnFormatted: formatYMDEn(paidOnYMD),
      deliveredOnFormatted: deliveredOnYMD
        ? formatYMDEn(deliveredOnYMD)
        : "[DELIVERY DATE NOT PROVIDED]",
      whatHappened: intake.whatHappened,
      alreadyDidLine: alreadyDidEn,
      remedyText: remedy.en,
      deadlineFormatted: formatYMDEn(deadline),
      utrLine: utrLineEn,
      userDisplayName: intake.userDisplayName ?? "[Your name]",
      city: intake.city ?? "",
    },
    hi: {
      orderId: intake.orderId ?? "[ऑर्डर आईडी उपलब्ध नहीं — स्क्रीनशॉट संलग्न करें]",
      platformName,
      companyName,
      amountInr: formatInrNumber(intake.amountInr),
      paidOnFormatted: formatYMDHi(paidOnYMD),
      deliveredOnFormatted: deliveredOnYMD
        ? formatYMDHi(deliveredOnYMD)
        : "[डिलीवरी तिथि उपलब्ध नहीं]",
      whatHappened: intake.whatHappened,
      alreadyDidLine: alreadyDidHi,
      remedyText: remedy.hi,
      deadlineFormatted: formatYMDHi(deadline),
      utrLine: utrLineHi,
      userDisplayName: intake.userDisplayName ?? "[आपका नाम]",
      city: intake.city ?? "",
    },
  };
}

function nchFields(intake: Intake, catalog: CompanyCatalog, deadline: YMD): Record<string, string> {
  return {
    "Company / Platform Name": recipientLabel(intake, catalog),
    "Order / Transaction ID": intake.orderId ?? "Not available",
    "Amount (INR)": formatInr(intake.amountInr),
    "Date of Purchase / Payment": formatYMDEn(ymdFromISODate(intake.paidOn)),
    "Nature of Complaint": intake.whatHappened,
    "Remedy Sought": REMEDY_TEXT[intake.desiredRemedy].en,
    "Response Deadline Given to Company": formatYMDEn(deadline),
  };
}

function bankFields(intake: Intake, deadline: YMD): Record<string, string> | undefined {
  if (intake.category !== "upi") return undefined;
  return {
    "UTR / Transaction Reference": intake.utr ?? "Not available — locate via amount/date/time",
    "Amount (INR)": formatInr(intake.amountInr),
    "Date of Transaction": formatYMDEn(ymdFromISODate(intake.paidOn)),
    "Remitting App": intake.platform,
    Issue: intake.whatHappened,
    "Deadline Given to Bank": formatYMDEn(deadline),
  };
}

function nextSteps(intake: Intake): { en: string[]; hi: string[] } {
  if (intake.category === "upi") {
    return {
      en: [
        "Contact your bank's grievance/nodal officer with the UTR and this packet.",
        "If unresolved after the deadline, file on the RBI Complaint Management System (CMS).",
        "Escalate to the RBI Banking Ombudsman if the bank does not respond within 30 days.",
      ],
      hi: [
        "UTR और यह पैकेट लेकर अपने बैंक के शिकायत/नोडल अधिकारी से संपर्क करें।",
        "यदि डेडलाइन के बाद भी समाधान नहीं होता, तो RBI शिकायत प्रबंधन प्रणाली (CMS) पर शिकायत दर्ज करें।",
        "यदि बैंक 30 दिनों में जवाब नहीं देता, तो RBI बैंकिंग लोकपाल तक शिकायत बढ़ाएं।",
      ],
    };
  }
  return {
    en: [
      "Send this message/email to the platform's official grievance channel.",
      "If unresolved after the deadline, file a complaint on the National Consumer Helpline (1915) or consumerhelpline.gov.in.",
      "If still unresolved, file a case on e-Daakhil under the Consumer Protection Act, 2019.",
    ],
    hi: [
      "यह संदेश/ईमेल प्लेटफ़ॉर्म के आधिकारिक शिकायत चैनल पर भेजें।",
      "यदि डेडलाइन के बाद भी समाधान नहीं होता, तो नेशनल कंज्यूमर हेल्पलाइन (1915) या consumerhelpline.gov.in पर शिकायत दर्ज करें।",
      "यदि फिर भी समाधान नहीं होता, तो उपभोक्ता संरक्षण अधिनियम, 2019 के तहत e-Daakhil पर मामला दर्ज करें।",
    ],
  };
}

export function generatePacket(intake: Intake, catalog: CompanyCatalog, now: Date = new Date()): Packet {
  const deadline = computeDeadlineYMD(intake.deadlineDays, now);
  const slots = buildSlots(intake, catalog, deadline);
  const en = loadTemplateFile(intake.templateId, "en");
  const hi = loadTemplateFile(intake.templateId, "hi");
  const { utr: _utr, ...intakeWithoutUtr } = intake;

  return {
    id: ulid(),
    createdAt: now.toISOString(),
    intake: intakeWithoutUtr,
    artifacts: {
      whatsapp: {
        en: fillSlots(en.whatsapp, slots.en),
        hi: fillSlots(hi.whatsapp, slots.hi),
      },
      emailSubject: {
        en: fillSlots(en.email_subject, slots.en),
        hi: fillSlots(hi.email_subject, slots.hi),
      },
      emailBody: {
        en: fillSlots(en.email_body, slots.en),
        hi: fillSlots(hi.email_body, slots.hi),
      },
      nchFields: nchFields(intake, catalog, deadline),
      bankFields: bankFields(intake, deadline),
      portalLinks: intake.category === "upi" ? PORTAL_LINKS_UPI : PORTAL_LINKS_ECOM,
      nextSteps: nextSteps(intake),
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -w @nyaypatra/core`
Expected: PASS — all tests across every file (schema, dates, templateLoader, companies, generatePacket) green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/generatePacket.ts packages/core/test/generatePacket.test.ts
git commit -m "feat(core): implement generatePacket and full fixture test coverage"
```

---

### Task 9: CLI fixture printer

**Files:**
- Create: `packages/core/src/cli.ts`

**Interfaces:**
- Consumes: `generatePacket` (Task 8), `loadCompanyCatalog` (Task 4), `Intake` (Task 2).
- Produces: a runnable script satisfying the PRD's Phase 0 exit criterion — "CLI or unit test: `generatePacket(fixture)` prints WhatsApp text" (§14).

- [ ] **Step 1: Write `packages/core/src/cli.ts`**

```typescript
import { generatePacket } from "./generatePacket";
import { loadCompanyCatalog } from "./companies";
import type { Intake } from "./types";

const fixture: Intake = {
  category: "ecommerce",
  templateId: "ecom_wrong_item",
  locale: "en",
  platform: "flipkart",
  orderId: "OD123",
  amountInr: 2499,
  paidOn: "2026-09-10",
  deliveredOn: "2026-09-14",
  whatHappened: "wrong mixer, cracked blade",
  alreadyDid: "raised in-app ticket",
  desiredRemedy: "pickup_and_refund",
  deadlineDays: 7,
};

const packet = generatePacket(fixture, loadCompanyCatalog());

console.log("--- WhatsApp (en) ---");
console.log(packet.artifacts.whatsapp.en);
console.log("\n--- WhatsApp (hi) ---");
console.log(packet.artifacts.whatsapp.hi);
```

- [ ] **Step 2: Run it and manually verify the output reads like a real complaint letter**

Run: `npm run print:fixture -w @nyaypatra/core`
Expected: prints both WhatsApp texts to the terminal. Read them — confirm the English version matches the shape in PRD §16, and the Hindi version is coherent, formal Hindi (not mixed-script garbage, no leftover `{{slot}}` markers).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/cli.ts
git commit -m "feat(core): add CLI fixture printer for manual review"
```

---

## Definition of Done for Phase 0

- [ ] `npm test -w @nyaypatra/core` passes with zero failures.
- [ ] `npm run print:fixture -w @nyaypatra/core` prints a complete, readable English and Hindi WhatsApp complaint for the PRD §16 fixture, with no `{{slot}}` markers left unfilled.
- [ ] `generatePacket` never throws on missing optional fields (`orderId`, `deliveredOn`, `alreadyDid`, `utr`) — it substitutes explicit placeholders instead.
- [ ] `Packet.intake` never contains `utr`, even when the input `Intake` did.
- [ ] Show this to the founder before starting Phase 1 (PRD §15: "Stop and show the founder after each step").
