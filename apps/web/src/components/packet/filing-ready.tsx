"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Button, ChipGroup, CopyButton, DateField, Field, FieldGroup, Input, MoneyField } from "@nyaypatra/ui";
import {
  EVIDENCE_KEYS,
  READINESS_MESSAGES,
  buildFilingKit,
  buildNchBlock,
  checkFilingReadiness,
  loadCompanyCatalog,
  nowToIstYMD,
  ymdToIsoDate,
  type EvidenceKey,
  type FilingFacts,
  type Packet,
  type ReadinessIssue,
} from "@nyaypatra/core";
import { track } from "@/lib/analytics/track";
import type { UiLocale } from "@/lib/i18n/locale";
import type { FilingStrings } from "@/lib/i18n/messages/filing";

interface Form {
  amountClaimed: string;
  compensation: string;
  issueOn: string;
  firstComplaintOn: string;
  lastReplyOn: string;
  ticketRef: string;
  replyReason: string;
  channel: string;
  legalName: string;
  registeredOffice: string;
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  email: string;
  addressType: "present" | "permanent" | "business";
  evidence: EvidenceKey[];
}

const catalog = loadCompanyCatalog();
const toInt = (v: string) => Number.parseInt(v.replace(/[^\d]/g, ""), 10);
const storageKey = (id: string) => `np:filing:${id}`;

function initialForm(packet: Packet): Form {
  const i = packet.intake;
  return {
    amountClaimed: String(i.amountInr),
    compensation: "",
    issueOn: i.deliveredOn ?? i.issueOn ?? i.paidOn,
    firstComplaintOn: "",
    lastReplyOn: "",
    ticketRef: "",
    replyReason: "",
    channel: "",
    legalName: catalog[i.platform]?.legalName ?? i.companyName ?? "",
    registeredOffice: "",
    fullName: i.userDisplayName ?? "",
    addressLine: "",
    city: i.city ?? "",
    state: i.state ?? "",
    pincode: "",
    mobile: "",
    email: "",
    addressType: "present",
    evidence: [],
  };
}

function toFacts(f: Form): FilingFacts {
  const claimed = toInt(f.amountClaimed);
  const comp = toInt(f.compensation);
  return {
    amountClaimed: Number.isFinite(claimed) ? claimed : 0,
    compensationClaimedInr: Number.isFinite(comp) && comp > 0 ? comp : undefined,
    issueOn: f.issueOn,
    firstComplaintOn: f.firstComplaintOn || undefined,
    lastReplyOn: f.lastReplyOn || undefined,
    companyTicketRef: f.ticketRef.trim() || undefined,
    companyReplyReason: f.replyReason.trim() || undefined,
    contactChannel: f.channel.trim() || undefined,
    evidenceHave: f.evidence,
    complainant: {
      fullName: f.fullName,
      addressLine: f.addressLine,
      city: f.city,
      state: f.state,
      pincode: f.pincode,
      mobile: f.mobile,
      email: f.email,
      addressType: f.addressType,
    },
    opposite: { legalName: f.legalName, registeredOffice: f.registeredOffice },
  };
}

const box = "whitespace-pre-wrap break-words rounded-field border-2 border-ink bg-cream p-3 text-[15px] font-medium";

export interface FilingReadyProps {
  packet: Packet;
  locale: UiLocale;
  strings: FilingStrings;
  copy: { idle: string; done: string };
  /** Called with true while the kit is the thing being printed, so the page can hide the letter. */
  onPrintKit: (printing: boolean) => void;
}

/**
 * The "File it" tab. Everything here, including the complainant's name, address and phone, is held in
 * this browser (localStorage) and turned into the NCH answers and e-Jagriti kit locally. None of it is
 * sent to the server, so the saved packet stays free of personal details.
 */
export function FilingReady({ packet, locale, strings: t, copy, onPrintKit }: FilingReadyProps) {
  const [form, setForm] = useState<Form>(() => initialForm(packet));
  const [checked, setChecked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(packet.id));
      if (raw) setForm({ ...initialForm(packet), ...(JSON.parse(raw) as Partial<Form>) });
    } catch {
      // Private mode or corrupt value: start from the defaults.
    }
    setLoaded(true);
  }, [packet]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey(packet.id), JSON.stringify(form));
    } catch {
      // Storage full or blocked: the form still works, it just will not be remembered.
    }
  }, [form, loaded, packet.id]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const intake = packet.intake;
  const facts = useMemo(() => toFacts(form), [form]);
  const readiness = useMemo(() => checkFilingReadiness(intake, facts), [intake, facts]);
  const output = useMemo(
    () =>
      readiness.ready
        ? { nch: buildNchBlock(intake, facts, catalog), kit: buildFilingKit(intake, facts, catalog) }
        : null,
    [readiness.ready, intake, facts],
  );
  const today = ymdToIsoDate(nowToIstYMD());

  const issueFor = (field: string): ReadinessIssue | undefined => readiness.blockers.find((b) => b.field === field);
  const err = (field: string) => (checked && issueFor(field) ? READINESS_MESSAGES[issueFor(field)!.code][locale] : undefined);
  const f = t.fields;

  function printKit() {
    track("filing_kit_printed", {});
    flushSync(() => {
      setPrinting(true);
      onPrintKit(true);
    });
    window.print();
    setPrinting(false);
    onPrintKit(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-base font-medium">{t.intro}</p>
      <p className="rounded-field border-2 border-ink bg-mint p-3 text-sm font-extrabold">{t.privacy}</p>

      <section aria-label={t.sections.claim} className="flex flex-col gap-4">
        <h3 className="font-display text-xl font-extrabold tracking-tight">{t.sections.claim}</h3>
        <Field id="f-claim" label={f.amountClaimed} error={err("amountClaimed")}>
          {(c) => <MoneyField {...c} value={form.amountClaimed} onChange={(e) => set("amountClaimed", e.target.value)} />}
        </Field>
        <Field id="f-comp" label={f.compensation} optionalLabel={f.optional}>
          {(c) => <MoneyField {...c} value={form.compensation} onChange={(e) => set("compensation", e.target.value)} />}
        </Field>
        <Field id="f-issue" label={f.issueOn} hint={f.issueOnHint} error={err("issueOn")}>
          {(c) => <DateField {...c} min={packet.intake.paidOn} max={today} value={form.issueOn} onChange={(e) => set("issueOn", e.target.value)} />}
        </Field>
        <Field id="f-first" label={f.firstComplaintOn} optionalLabel={f.optional} error={err("firstComplaintOn")}>
          {(c) => <DateField {...c} max={today} value={form.firstComplaintOn} onChange={(e) => set("firstComplaintOn", e.target.value)} />}
        </Field>
        <Field id="f-last" label={f.lastReplyOn} optionalLabel={f.optional} error={err("lastReplyOn")}>
          {(c) => <DateField {...c} max={today} value={form.lastReplyOn} onChange={(e) => set("lastReplyOn", e.target.value)} />}
        </Field>
        <Field id="f-ticket" label={f.ticketRef} optionalLabel={f.optional}>
          {(c) => <Input {...c} maxLength={60} value={form.ticketRef} onChange={(e) => set("ticketRef", e.target.value)} />}
        </Field>
        <Field id="f-reason" label={f.replyReason} optionalLabel={f.optional}>
          {(c) => <Input {...c} maxLength={200} value={form.replyReason} onChange={(e) => set("replyReason", e.target.value)} />}
        </Field>
        <Field id="f-channel" label={f.channel} optionalLabel={f.optional}>
          {(c) => <Input {...c} maxLength={40} value={form.channel} onChange={(e) => set("channel", e.target.value)} />}
        </Field>
      </section>

      <section aria-label={t.sections.company} className="flex flex-col gap-4">
        <h3 className="font-display text-xl font-extrabold tracking-tight">{t.sections.company}</h3>
        <Field id="f-legal" label={f.legalName} error={err("opposite.legalName")}>
          {(c) => <Input {...c} value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />}
        </Field>
        <Field id="f-office" label={f.registeredOffice} hint={f.registeredOfficeHint} error={err("opposite.registeredOffice")}>
          {(c) => <Input {...c} value={form.registeredOffice} onChange={(e) => set("registeredOffice", e.target.value)} />}
        </Field>
      </section>

      <section aria-label={t.sections.you} className="flex flex-col gap-4">
        <h3 className="font-display text-xl font-extrabold tracking-tight">{t.sections.you}</h3>
        <Field id="f-name" label={f.fullName} error={err("complainant.fullName")}>
          {(c) => <Input {...c} autoComplete="name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />}
        </Field>
        <Field id="f-addr" label={f.addressLine} error={err("complainant.addressLine")}>
          {(c) => <Input {...c} autoComplete="street-address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />}
        </Field>
        <Field id="f-city" label={f.city} error={err("complainant.city")}>
          {(c) => <Input {...c} autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} />}
        </Field>
        <Field id="f-state" label={f.state} error={err("complainant.state")}>
          {(c) => <Input {...c} autoComplete="address-level1" value={form.state} onChange={(e) => set("state", e.target.value)} />}
        </Field>
        <Field id="f-pin" label={f.pincode} error={err("complainant.pincode")}>
          {(c) => <Input {...c} inputMode="numeric" maxLength={6} autoComplete="postal-code" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />}
        </Field>
        <Field id="f-mobile" label={f.mobile} error={err("complainant.mobile")}>
          {(c) => <Input {...c} inputMode="tel" maxLength={10} autoComplete="tel-national" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />}
        </Field>
        <Field id="f-email" label={f.email} error={err("complainant.email")}>
          {(c) => <Input {...c} type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />}
        </Field>
        <FieldGroup id="f-atype" label={f.addressType}>
          <ChipGroup
            name="addressType"
            legend={f.addressType}
            value={form.addressType}
            onValueChange={(v) => set("addressType", v as Form["addressType"])}
            options={(["present", "permanent", "business"] as const).map((k) => ({ value: k, label: t.addressTypes[k] }))}
          />
        </FieldGroup>
      </section>

      <FieldGroup id="f-evidence" label={t.sections.evidence}>
        <div className="flex flex-col gap-2">
          {EVIDENCE_KEYS.map((k) => (
            <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-bold">
              <input
                type="checkbox"
                className="size-5 accent-ink"
                checked={form.evidence.includes(k)}
                onChange={(e) => set("evidence", e.target.checked ? [...form.evidence, k] : form.evidence.filter((x) => x !== k))}
              />
              {t.evidence[k]}
            </label>
          ))}
        </div>
      </FieldGroup>

      <div className="flex flex-col gap-3" aria-live="polite">
        {!readiness.ready ? (
          <>
            <Button variant="accent" className="self-start" onClick={() => { setChecked(true); track("filing_checked", {}); }}>
              {t.check}
            </Button>
            {checked ? (
              <div className="rounded-card border-[3px] border-ink bg-peach p-4 shadow-hard">
                <h3 className="font-display text-lg font-extrabold">{t.fixThese}</h3>
                <ul role="list" className="mt-2 list-disc space-y-1 pl-5 text-[15px] font-medium">
                  {readiness.blockers.map((b, i) => (
                    <li key={`${b.code}-${b.field}-${i}`}>
                      {READINESS_MESSAGES[b.code][locale]} {b.field ? <span className="font-extrabold">({b.field})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}

        {readiness.warnings.length > 0 ? (
          <div className="rounded-card border-[3px] border-ink bg-butter p-4 shadow-hard">
            <h3 className="font-display text-lg font-extrabold">{t.watchOut}</h3>
            <ul role="list" className="mt-2 list-disc space-y-1 pl-5 text-[15px] font-medium">
              {readiness.warnings.map((w) => (
                <li key={w.code}>{READINESS_MESSAGES[w.code][locale]}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {output ? (
        <div className="flex flex-col gap-8" data-reveal>
          <div className="rounded-card border-[3px] border-ink bg-mint p-4 shadow-hard">
            <h3 className="font-display text-xl font-extrabold">{t.readyTitle}</h3>
            <p className="text-[15px] font-medium">{t.readyBody}</p>
          </div>

          <section aria-label={t.nchTitle} lang="en" className="flex flex-col gap-3">
            <h3 className="font-display text-xl font-extrabold tracking-tight">{t.nchTitle}</h3>
            <p className="text-sm font-medium">{t.nchHelp}</p>
            {output.nch.map((row) => (
              <div key={row.label} className="flex flex-col gap-2">
                <p className="text-sm font-extrabold">{row.label}</p>
                <pre className={box}>{row.value}</pre>
                <CopyButton className="self-start" text={row.value} idleLabel={copy.idle} doneLabel={copy.done} onCopied={() => track("copy_clicked", { tab: "filing_nch", lang: "en" })} />
              </div>
            ))}
          </section>

          <section aria-label={t.jagritiTitle} lang="en" className="flex flex-col gap-3">
            <h3 className="font-display text-xl font-extrabold tracking-tight">{t.jagritiTitle}</h3>
            <p className="text-sm font-medium">{t.jagritiHelp}</p>
            <dl className="grid gap-3">
              {output.kit.caseDetails.map((row) => (
                <div key={row.label}>
                  <dt className="text-sm font-extrabold">{row.label}</dt>
                  <dd className="break-words text-[15px] font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label={t.docsTitle} lang="en" className="flex flex-col gap-3">
            <h3 className="font-display text-xl font-extrabold tracking-tight">{t.docsTitle}</h3>
            <p className="text-sm font-medium">{t.docsHelp}</p>
            {output.kit.documents.map((d) => (
              <details key={d.title} className="rounded-field border-2 border-ink bg-white p-3">
                <summary className="cursor-pointer text-[15px] font-extrabold">{d.title}</summary>
                {d.note ? <p className="mt-2 text-sm font-bold">{d.note}</p> : null}
                <pre className={`${box} mt-2`}>{d.body}</pre>
                <CopyButton className="mt-2" text={d.body} idleLabel={copy.idle} doneLabel={copy.done} onCopied={() => track("copy_clicked", { tab: "filing_doc", lang: "en" })} />
              </details>
            ))}
            {output.kit.annexures.length ? (
              <>
                <p className="text-sm font-extrabold">{t.annexTitle}</p>
                <ol role="list" className="list-decimal space-y-1 pl-6 text-[15px] font-medium">
                  {output.kit.annexures.map((a) => (
                    <li key={a.title}>{a.title}</li>
                  ))}
                </ol>
              </>
            ) : null}
          </section>

          <section aria-label={t.stepsTitle} lang="en" className="flex flex-col gap-3">
            <h3 className="font-display text-xl font-extrabold tracking-tight">{t.stepsTitle}</h3>
            <ol role="list" className="list-decimal space-y-2 pl-6 text-[15px] font-medium">
              {output.kit.portalSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>

          <Button variant="primary" className="self-start" onClick={printKit}>
            {t.print}
          </Button>
        </div>
      ) : null}

      <p className="text-sm font-medium">{t.noGuarantee}</p>

      {output && printing ? createPortal(<FilingKitPrint heading={t.printHeading} kit={output.kit} />, document.body) : null}
    </div>
  );
}

/** Print-only: every document on its own page, in portal order. Hidden on screen. */
function FilingKitPrint({ heading, kit }: { heading: string; kit: ReturnType<typeof buildFilingKit> }) {
  return (
    <div aria-hidden="true" lang="en" data-filing-kit className="hidden print:block">
      <h1 className="mb-4 text-xl font-extrabold">{heading}</h1>
      <dl className="mb-6 grid gap-1 text-[13px]">
        {kit.caseDetails.map((r) => (
          <div key={r.label}>
            <dt className="inline font-bold">{r.label}: </dt>
            <dd className="inline">{r.value}</dd>
          </div>
        ))}
      </dl>
      {kit.documents.map((d) => (
        <section key={d.title} className="break-before-page">
          <h2 className="mb-2 text-lg font-extrabold">{d.title}</h2>
          {d.note ? <p className="mb-2 text-[13px] font-bold">{d.note}</p> : null}
          <pre className="whitespace-pre-wrap font-sans text-[13px]">{d.body}</pre>
        </section>
      ))}
    </div>
  );
}
