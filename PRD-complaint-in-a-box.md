# PRD: Complaint-in-a-Box (working name: Mukadma Lite / RefundLetter)

**Version:** 0.2  
**Date:** 2026-09-18  
**Status:** Ready for implementation  
**Audience:** Human founder + coding agents (Cursor, Claude Code, Codex, Grok)  
**Primary job:** Turn a messy consumer grievance into a ready-to-send complaint packet in ≤ 60 seconds.

**v0.2 changes:** Added a 6–12 month growth target (20,000–40,000 users, §2, §5b) alongside the original 12-week MVP checkpoint. Re-confirmed the PWA-first platform decision against that target with explicit funnel reasoning (§3). Added optional login pulled forward to Phase 1c (§6a), a growth/distribution section (§6b), and a monetization direction for later phases (§6c). Phase 0/1 MVP scope (templates, form, packet UI) is unchanged.

---

## 0. How an AI agent should use this document

1. Implement **Phase 0 + Phase 1** only unless the user explicitly asks for later phases.
2. Do not invent marketplaces, login walls, payments, or native apps in Phase 1.
3. Every user-visible string must exist in **en-IN** and **hi-IN**.
4. Treat the output packet (WhatsApp text + email/PDF + NCH field map) as the core product. The form is only an intake.
5. Prefer boring, testable code: templates + slot filling first. LLM rewrite is optional and behind a flag.
6. Never file a complaint on the user’s behalf in Phase 1. Generate + instruct. Do not submit to NCH/RBI/IRDAI APIs.
7. Do not store payment UTRs, full bank account numbers, Aadhaar, or uploaded ID photos. If a field is needed for generation, use it in-memory and drop it after PDF download unless the user opts into a saved case.
8. If a requirement conflicts with Indian law or portal ToS, keep generation local and link out.

---

## 1. Problem

Indian consumers lose money and time to wrong deliveries, missing refunds, failed UPI debits, and drip pricing. Official channels exist (seller chat, NCH 1915, bank grievance, RBI Ombudsman) but people do not know what to write or which fields to fill. They beg in in-app chat. A dated, specific letter changes the conversation.

## 2. Goal

**12-week MVP validation checkpoint:**
- A working public web app that generates complaint packets for the 10 launch templates.
- 1,000 packets generated (north-star early metric).
- 50 opted-in “win” stories published.
- Hindi + English throughout.

**6–12 month growth target:** 20,000–40,000 users. This is a business goal, not a vague ceiling — track it against quarterly checkpoints (see §5b) and let it drive Phase 1b/1c/2 prioritization. It is not a Phase 1 MVP requirement; Phase 0/1 scope below is unchanged by it. Owner is solo (founder + AI coding agents), so growth leans on low-cost/high-leverage channels (SEO, Reddit/X, word of mouth) rather than paid acquisition — see §6b.

**Non-goals (Phase 1):**
- Native iOS/Android apps *(deliberate: see §3 — install friction directly opposes activation and cross-post virality, which are the primary path to the 20-40k target)*
- Lawyer marketplace / paid filing *(design direction exists — see §6c — but building it is deferred until Phase 1c/2 retention data justifies it)*
- Auto-submit to government portals
- User social feed or chat
- Payments or subscriptions in the free-generate flow
- Login required to generate the first letter *(stays true even as optional login is added in Phase 1c — see §6a)*

## 3. Platform decision

**Phase 1 = mobile-first web (PWA). This is deliberate, not a placeholder — re-litigated against the 20-40k growth target and confirmed.**

Reason: WhatsApp + Chrome is how this product is used. A Play Store app adds install drop-off and review delay for zero extra value on day 1. More specifically, for a solo builder whose primary growth channels are SEO, X/Twitter, Reddit, and word-of-mouth (see §6b), every extra step between "see the link" and "see value" kills a viral moment:

- **SEO (Google search for "flipkart wrong item refund" etc.) is likely the single largest volume channel over 6-12 months** and is close to unreachable via native app-store search — different, much smaller discovery surface for this kind of long-tail intent. This is *why* §9 F8 and §6b invest in SEO landing pages.
- **Reddit and X virality depends on zero-friction "try it now."** A cold viral post driving clicks to a live web tool converts roughly 2-3x more of those clicks into actual generated packets than the same post driving clicks to an app-store page (rough funnel: web ~30-50% of clickers generate a packet vs. app ~20-30% install × ~50-70% complete onboarding ≈ 10-20% net). Reddit specifically punishes app-only asks for single-action utilities — "just tried it, got my refund back" comments (the actual viral mechanic) require zero-friction trying.
- **Word-of-mouth for this product is reactive WhatsApp forwarding** ("forward this to your friend who's mid-dispute") — per personas P1/P3, this only converts if the recipient can act in one tap, not install-then-act.

**Phase 1c/2 = same codebase wrapped, once retention data justifies it:**
- PWA install prompt after first successful generate
- Capacitor or React Native later, justified by need for camera-first receipt capture + push "your 15-day deadline is tomorrow" (ties to optional login/saved cases, §6a) — build this once login + monetization (§6c) have produced real returning-user data, not speculatively

Agents: default to **Next.js App Router + TypeScript + Tailwind + a PDF library**. Do not start Expo/React Native unless the founder insists. If they insist, keep one shared `packages/core` for templates, schema, and generators so web and app stay identical.

Suggested name options (pick one, use consistently):
- `nyaypatra` (Nyay Patra)
- `letter1915`
- `refundletter.in`

Use `nyaypatra` as the code name in repos.

---

## 4. Personas

**P1 Priya (shopper), 26, Pune**  
Wrong mixer from Flipkart. Uses WhatsApp for everything. Will not create an account before seeing the letter.

**P2 Ramesh (UPI payer), 41, Surat**  
₹8,000 left his account, carpenter says not received. Has UTR in GPay history. Wants bank + RBI language.

**P3 Anjali (caregiver), 34**  
Helping her father. Needs Hindi output she can forward to her brother.

---

## 5. Success metrics

| Metric | Definition | Phase 1 target |
|---|---|---|
| Packets generated | Successful generate events | 1,000 |
| Copy/download rate | % of generates that copy or download ≥1 artifact | ≥ 60% |
| Hindi share | Generates with `locale=hi` or `both` | ≥ 40% |
| Wins collected | Opt-in public win cards | 50 |
| Time to first packet | Landing → PDF/copy | ≤ 90s p50 |

Analytics events (implement all):
`landing_view`, `category_selected`, `template_selected`, `generate_clicked`, `generate_succeeded`, `generate_failed`, `tab_viewed`, `copied`, `pdf_downloaded`, `portal_link_clicked`, `win_prompt_shown`, `win_submitted`, `language_toggled`

Phase 1c adds: `signup_prompt_shown`, `signup_completed`, `case_saved`, `reminder_sent`.

### 5b. Growth checkpoints (6–12 month target: 20,000–40,000 users)

Track cumulative unique users generating at least one packet. These are planning checkpoints, not contractual — revisit quarterly and adjust channel mix (§6b) based on what's actually converting.

| Checkpoint | Cumulative users (low–high) | Primary expected driver |
|---|---|---|
| End of Phase 1 (week ~10) | 200–1,000 | Direct share, early Reddit/X posts |
| Month 3 | 2,000–5,000 | SEO indexing lag ends, launch posts compound, wins wall live |
| Month 6 | 6,000–15,000 | SEO landing pages ranking, win-story social proof, WhatsApp forwarding loop |
| Month 9 | 12,000–28,000 | SEO compounding, optional login/saved cases (Phase 1c) improving return visits |
| Month 12 | 20,000–40,000 | Full channel mix mature; monetized tier (§6c) may be live if retention supports it |

If actual numbers are tracking well below the low end by month 3, the fix is almost always channel mix (§6b) or activation friction — re-check funnel drop-off (§5 copy/download rate, time-to-first-packet) before assuming the product itself is wrong.

---

## 6. Information architecture

```
/                       landing + category picker
/new/[category]         intake form
/packet/[id]            result (client id or short uuid; no auth)
/wins                   public win wall
/wins/[slug]            one win (SEO)
/how-it-works
/legal/disclaimer
/legal/privacy
/legal/terms
/login                  Phase 1c — optional, never in the generate path (see §6a)
/dashboard              Phase 1c — saved cases, only reachable once signed in
```

Deep links for SEO (Phase 1b, after templates work):
```
/flipkart-wrong-product-refund
/amazon-order-not-delivered
/upi-money-debited-merchant-not-received
```
Each of these pages is a pre-filled landing that jumps to `/new/ecommerce?template=wrong_item&platform=flipkart`.

### 6a. Optional login (Phase 1c)

Pulled forward from Phase 2 because it's the natural on-ramp to monetization (§6c) and to deadline reminders — but the core rule from §2 is absolute: **first-time generate is never gated behind login.**

Flow:
```
Landing → generate (no login) → packet shown
  → soft prompt: "Save this case & get a reminder before your deadline" → optional signup (OTP, phone-based — matches Indian user expectations, no password)
  → Returning signed-in user → /dashboard: past cases, deadline countdowns, status notes they add manually (no auto-scraping of resolution status in Phase 1c)
```

Rules:
- Declining the prompt must be one tap, no dark patterns, no repeated nagging within a session.
- Login unlocks: saved cases, deadline reminder emails/WhatsApp (via wa.me, not Business API — matches §14 Phase 1b), a personal history of packets.
- Login does NOT unlock any capability that free/anonymous generate has (no feature removed from the free path to force signup).
- Storage: once signed in, `Intake` (minus stripped `utr`, per §8.2) may persist beyond the 7-day expiry in §8.3, scoped to that user only.

**AC:** A user who never signs in can still complete the entire core flow (§7) with zero degradation. Signup completion rate and its impact on week-2 return rate are tracked (`signup_prompt_shown`, `signup_completed`, §5).

### 6b. Growth & distribution (informs priority, not a build spec)

Given solo + AI-agent build capacity and no paid acquisition budget (§2), growth leans on channels with high leverage per unit of effort:

- **SEO (primary long-run channel).** Expand §9 F8 beyond the initial 8 slugs as templates prove out; each new long-tail query page is near-zero marginal cost once the generator exists. This is expected to dominate volume by month 6+ (§5b).
- **Reddit / X launch posts.** Founder-voice "I built this because X happened to me / a friend" posts in relevant communities (r/india, r/IndianConsumer-style subs, personal finance/shopping threads, X threads about specific platform complaints) at each major milestone (MVP launch, 10th template, first public win story). Effective only because the linked product requires zero install to try (§3) — do not let this channel design drift toward anything that adds friction.
- **Wins wall as social proof engine (§9 F7).** Each published win is both retention content and a shareable artifact (`/wins/[slug]` is individually linkable and indexable) — treat win-collection as a growth feature, not just a testimonial page.
- **WhatsApp forward loop.** Add an explicit "share this" affordance on the packet page (wa.me prefilled link to forward the *tool*, not just the generated text) — the product already lives where forwarding happens (§3); make the loop one tap.
- **What this section deliberately excludes:** paid ads, influencer spend, app-store optimization (no app in Phase 1/1c), cold outreach/sales — all assume budget or team capacity not available under §2's stated constraints. Revisit if monetization (§6c) funds it.

### 6c. Monetization direction (design now, build later)

Phase 1/1c ship entirely free, matching §2's non-goals. This section exists so later work has a target to build toward, not to justify building it now — do not implement any of this before Phase 1c login exists and shows real retention.

Free tier (permanent, not a trial): unlimited generate, copy, download, portal field-map — the whole core flow in §7.

Candidate paid tier, once justified by data:
- **"File it for us" assist** — user pays for the packet to actually be submitted / followed up on their behalf (this crosses the §2 non-goal "auto-submit to government portals" as *automated* submission — a paid human/semi-assisted filing service is a different thing and would need its own legal review before building, not assumed safe by default).
- **Status tracking** — reminders, follow-up nudges, escalation-path suggestions tied to a saved case (§6a).
- **Lawyer referral** — matches §14 Phase 3 "lawyer network," gated behind having saved-case usage data to know which templates/amounts justify it.
- **B2B angle** — a grievance-deflection widget licensed to platforms/banks/D2C brands who'd rather resolve a complaint than have it go public; distinct sales motion, only worth exploring once the consumer side has real usage/credibility (the wins wall, §6b, doubles as the sales pitch).

**AC (for whenever this phase starts, not now):** no change to the free path's capability set (§6a); any paid feature must be additive, not a feature moved behind a paywall.

---

## 7. Core user flow

```
Landing
  → choose category (ecommerce | upi | food)
  → choose template (or auto-detect from short description)
  → fill 6–10 fields
  → optional photos (client-side only in Phase 1; not uploaded to server)
  → Generate
  → Packet page with 3 tabs
       Tab 1 WhatsApp/chat text     [default]
       Tab 2 Formal email + PDF
       Tab 3 Portal field map (NCH / bank / RBI)
  → Copy / Download / Open portal
  → Optional: “Did you get money back?” 7 days later (only if they left WhatsApp/email)
```

Empty states:
- Missing order id: still generate, insert `[ORDER ID NOT PROVIDED — attach screenshot]`.
- Missing amount: block generate, inline error.
- Unknown platform: allow `other` + free-text company name.

---

## 8. Domain model

### 8.1 Enums

```ts
type Locale = "en" | "hi" | "both";

type Category = "ecommerce" | "upi" | "food" | "hidden_fee"; // hidden_fee = phase 1.5

type TemplateId =
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

type Platform =
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

type DesiredRemedy =
  | "full_refund_original_mode"
  | "replacement"
  | "pickup_and_refund"
  | "reverse_failed_upi"
  | "remove_hidden_fee";
```

### 8.2 Intake schema (validate with Zod)

```ts
type Intake = {
  category: Category;
  templateId: TemplateId;
  locale: Locale;
  platform: Platform;
  companyName?: string;          // required if platform=other
  orderId?: string;
  utr?: string;                  // UPI only; do not persist
  amountInr: number;             // integer rupees
  paidOn: string;                // ISO date
  deliveredOn?: string;
  issueOn?: string;
  city?: string;
  state?: string;
  whatHappened: string;          // 20–600 chars
  alreadyDid?: string;
  desiredRemedy: DesiredRemedy;
  deadlineDays: 2 | 7 | 15;      // default 7 for ecom, 2 for UPI
  userDisplayName?: string;      // optional, used in PDF
};
```

### 8.3 Packet (generated, ephemeral)

```ts
type Packet = {
  id: string;                    // ulid
  createdAt: string;
  intake: Omit<Intake, "utr">;   // strip secrets
  artifacts: {
    whatsapp: { en: string; hi: string };
    emailSubject: { en: string; hi: string };
    emailBody: { en: string; hi: string };
    pdfUrl?: string;             // blob: or short-lived
    nchFields: Record<string, string>;
    bankFields?: Record<string, string>;
    portalLinks: { label: string; href: string; help: string }[];
    nextSteps: { en: string[]; hi: string[] };
  };
};
```

Phase 1 storage:
- Default: packet lives in `sessionStorage` + shareable URL with compressed payload **or** server row that expires in 7 days and stores no UTR/photos.
- Wins table is the only long-lived user content.

### 8.4 Win (public, opted-in)

```ts
type Win = {
  slug: string;
  city?: string;
  platform: Platform;
  templateId: TemplateId;
  amountInr: number;
  daysToResolution: number;
  oneLiner: string;              // max 140 chars, moderated
  createdAt: string;
};
```

No photos of people. No order IDs on the win card.

---

## 9. Feature specs (implement in this order)

### F0 — App shell
- Mobile-first layout, max width 640px for form/packet, 960px for landing.
- Language toggle sticky.
- Disclaimer footer on every generate page.
- Offline: form works; generate needs network if LLM on. Template-only generate must work offline.

**AC:** Lighthouse mobile ≥ 90 performance on landing. Layout does not require horizontal scroll at 360px.

### F1 — Category + template picker
Show 3 categories with 1-line examples.

**AC:** One tap selects category and lists templates. User can skip picker by using `?template=ecom_wrong_item`.

### F2 — Intake form
Render fields from a per-template field config (do not hardcode one giant form).

Field config example:

```ts
{
  templateId: "ecom_wrong_item",
  fields: [
    { key: "platform", type: "select", required: true },
    { key: "orderId", type: "text", required: false },
    { key: "amountInr", type: "money", required: true },
    { key: "paidOn", type: "date", required: true },
    { key: "deliveredOn", type: "date", required: true },
    { key: "whatHappened", type: "textarea", required: true, min: 20 },
    { key: "alreadyDid", type: "textarea", required: false },
    { key: "desiredRemedy", type: "select", required: true },
    { key: "city", type: "text", required: false }
  ]
}
```

**AC:** Invalid form cannot submit. Amount rejects commas/₹ and normalizes to integer. Dates cannot be in the future.

### F3 — Template engine (source of truth)
Pure functions:

```ts
generatePacket(intake: Intake, catalog: CompanyCatalog): Packet
```

Rules:
- Slot-fill first. No LLM required for a valid packet.
- If `whatHappened` is messy, optional `rewriteFacts(text, locale)` may clean grammar but must not invent order IDs, amounts, or dates.
- If LLM fails, fall back to raw user text inside the template.
- Every artifact must include: platform, amount, dates, remedy, deadline date (computed from today + deadlineDays, Asia/Kolkata).

**AC:** Snapshot tests for all 10 templates × en + hi with a fixture intake. Changing a template without updating snapshots should fail CI.

### F4 — Company catalog
JSON file `data/companies.json`:

```json
{
  "flipkart": {
    "legalName": "Flipkart Internet Private Limited",
    "grievanceUrl": "https://www.flipkart.com/helpcentre",
    "nchCompanyHint": "Flipkart",
    "chatHint": "Use in-app chat → Help Centre"
  }
}
```

Unknown platform uses `companyName` from intake.

**AC:** Adding a company is data-only. No code change required.

### F5 — Packet UI
- Default tab = WhatsApp.
- Copy button copies the visible locale. If locale=both, copy the visible tab language; provide “copy Hindi” / “copy English”.
- PDF is one A4 page: letterhead “Generated by Nyay Patra — not a law firm”, date/time IST, facts table, demand list, CPA 2019 deficiency mention (plain language, not fake vakalatnama).
- Portal tab: numbered paste map + official links only.

Official links to include (verify live at build time, keep in catalog):
- NCH: https://consumerhelpline.gov.in /
- e-Daakhil: https://e-daakhil.nic.in / or current e-Jagriti URL
- RBI CMS / Ombudsman: current RB-IOS page
- NPCI UPI help (for UPI templates)

**AC:** Copy writes exact artifact text to clipboard and shows toast. PDF downloads named `nyaypatra-{platform}-{date}.pdf`.

### F6 — Disclaimer + safety
Fixed copy (en + hi):

> This tool drafts text from facts you entered. It is not a lawyer, not the government, and does not file cases for you. Check names, amounts, and dates before you send.

Do not claim “guaranteed refund.” Do not display a fake advocate name or bar number.

**AC:** Disclaimer visible above Generate and on PDF.

### F7 — Wins wall (minimal)
After generate, a quiet module: “If you get money back, tell us (no order ID).”
Form: city, platform, amount, days, one liner. Manual approve flag `published`.

**AC:** Unpublished wins never appear on `/wins`. Slug pages are indexable.

### F8 — SEO landing pages (Phase 1b)
One page per high-intent query. Same generator, pre-selected template. Include 2–3 anonymized win cards when available.

Launch slugs:
- flipkart-wrong-product-refund
- flipkart-refund-delay
- amazon-order-not-delivered
- meesho-product-not-received
- upi-failed-transaction-refund
- gpay-money-debited-not-received
- phonepe-double-debit
- zomato-missing-item-refund

**AC:** Each page has unique H1, unique 150-word explainer, and working CTA to form.

---

## 10. Launch templates (copy contracts)

Each template must produce WhatsApp ≤ 700 characters, email 180–350 words.

### T1 `ecom_wrong_item`
Facts required: platform, amount, paidOn, deliveredOn, whatHappened.  
Demand default: pickup_and_refund.  
Deadline default: 7 days.  
Must mention: delivered item does not match listing.

### T2 `ecom_not_delivered`
Must mention: payment taken, delivery date slipped / not received.

### T3 `ecom_damaged`
Must mention: condition on arrival.

### T4 `ecom_refund_to_wallet`
Must demand refund to **original payment mode**, not wallet.

### T5 `ecom_seller_ghosted`
Must mention: seller unresponsive after X days.

### T6 `upi_debit_merchant_no_credit`
Must include UTR placeholder if missing.  
Must mention RBI failed / unconfirmed transaction TAT (T+5 for many failed UPI cases — phrase as “as per applicable RBI / NPCI turnaround times”, do not invent a penalty amount).  
Deadline default: 2 days to bank, then ombudsman path in nextSteps.

### T7 `upi_double_debit`
Must ask bank to reverse duplicate UTR.

### T8 `food_missing_item`
Swiggy/Zomato specific catalog links.

### T9 `food_wrong_item`

### T10 `fee_drip_pricing`
Fields: listedPrice, paidPrice, platform.  
Demand: refund of difference + mention of hidden charges / drip pricing in plain language.  
Do not accuse a company of a crime. Say “additional charges were revealed only at payment.”

---

## 11. LLM usage (optional, flagged)

`REWRITE_FACTS=true`

Prompt contract (system):

```
You clean user-written facts for a consumer complaint.
Do not add facts. Do not change numbers, IDs, dates, names, cities.
Do not allege fraud unless the user wrote that word.
Output JSON { "en": string, "hi": string } only.
If Hindi was not requested, still fill "hi" with a faithful translation of the cleaned English.
```

If the model output changes `amountInr` or `orderId`, discard LLM output and use raw text.

---

## 12. Legal / content rules for agents

- Cite Consumer Protection Act 2019 in plain language (“deficiency in service / unfair trade practice”) without quoting long copyrighted commentary.
- Do not generate a fake court petition, vakalatnama, or “through counsel” block in Phase 1.
- Do not scrape or reproduce NCH/RBI form HTML. Link and map fields.
- Privacy page must say: photos stay on device in Phase 1; UTR is not stored; packet URLs expire.
- Rate-limit generate endpoint: 10/hour/IP.

---

## 13. Tech recommendations

**Default (do this):**
- Next.js 15 App Router, TypeScript, Tailwind, Zod
- `pdf-lib` or `@react-pdf/renderer` for PDF
- `date-fns-tz` with `Asia/Kolkata`
- Vercel + SQLite/Turso or Supabase only for wins + optional expired packets
- Posthog or Plausible for events
- Folder layout:

```
apps/web
packages/core          # schemas, templates, generatePacket
packages/i18n          # en.json hi.json
data/companies.json
data/templates/*.md    # human-editable letter bodies with {{slots}}
```

**If founder forces an app:**
- Expo Router, same `packages/core`
- WebView-free: forms native, PDF via expo-print
- Still ship web first in the same week; app is a wrapper of the same generator

---

## 14. Phased roadmap

### Phase 0 — Day 1–2
- Repo + `packages/core` + 2 templates (ecom_wrong_item, upi_debit_merchant_no_credit)
- CLI or unit test: `generatePacket(fixture)` prints WhatsApp text
- No UI yet is acceptable if tests pass

### Phase 1 — Day 3–10 (MVP public)
- F0–F6, all 10 templates, en+hi
- Packet page + PDF
- Disclaimer + privacy
- Deploy web

### Phase 1b — Day 11–21
- F7 wins
- F8 SEO pages (launch slug set; expand ongoing per §6b as templates prove out)
- WhatsApp “send to me” via wa.me prefill (no Business API required)
- WhatsApp “share this tool” loop on packet page (§6b)

### Phase 1c — only after 200+ generates, moved up from Phase 2 (§6a)
- Optional login (OTP, phone-based), never gating first generate
- `/dashboard`, saved cases
- Deadline reminders (email/WhatsApp)
- Track signup_completed impact on week-2 return rate (§5b checkpoint driver)

### Phase 2 — only once Phase 1c shows real retention data
- Capacitor/Expo wrapper (§3 — justified by push notifications for saved-case deadlines, not built speculatively)
- Receipt OCR (amount + order id) as assist, user must confirm

### Phase 3 — design direction exists (§6c), do not start building now
- Paid “file it for us” assist (needs separate legal review — see §6c)
- Status tracking / escalation suggestions
- Lawyer network
- B2B grievance-deflection widget
- Insurance / rent letter packs (reuse engine)

---

## 15. Agent implementation checklist

Work in this sequence. Stop and show the founder after each step.

1. [ ] Create monorepo folders and Zod schemas.
2. [ ] Write `data/templates/ecom_wrong_item.en.md` and `.hi.md` with `{{amountInr}}` slots.
3. [ ] Implement `generatePacket` + 2 fixture tests.
4. [ ] Add remaining 8 templates with tests.
5. [ ] Build `/` and `/new/[category]` form from field config.
6. [ ] Build `/packet/[id]` tabs + clipboard + PDF.
7. [ ] Add company catalog + portal links.
8. [ ] i18n toggle, disclaimer, privacy.
9. [ ] Analytics events.
10. [ ] Deploy.
11. [ ] SEO pages + wins.

Definition of done for MVP:
- Cold user on a phone can produce a Flipkart wrong-item WhatsApp text and PDF without creating an account.
- Hindi packet is complete, not mixed-script garbage.
- Tests cover all templates.
- No UTR in logs.

---

## 16. Sample WhatsApp artifact (fixture)

Intake: Flipkart, OD123, ₹2499, paid 2026-09-10, delivered 2026-09-14, wrong mixer cracked blade, ticket already raised, remedy pickup_and_refund, deadline 7 days, locale en.

Expected shape (not exact punctuation-locked, but all facts must appear):

```
Order OD123, Flipkart, paid ₹2499 on 10 Sep 2026.
Delivered 14 Sep 2026: wrong mixer, cracked blade.
Already raised in-app ticket. No resolution.

I want pickup of the wrong item and full refund to the original payment mode.

Please confirm in writing by {deadline}.
If unresolved I will file on the National Consumer Helpline (1915) and pursue remedies under the Consumer Protection Act, 2019.
```

---

## 17. Open questions (do not block MVP)

- Final public name and domain
- Whether to offer “both languages in one PDF”
- Whether win wall needs email verification
- Adding insurance templates (Phase 3)

If unspecified, agent chooses: name `Nyay Patra`, both-languages PDF = two pages, wins moderated manually via a `published` boolean in DB.
