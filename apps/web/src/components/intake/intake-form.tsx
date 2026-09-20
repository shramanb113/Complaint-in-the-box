"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, ChipGroup, DateField, Field, FieldGroup, Input, MoneyField, Textarea } from "@nyaypatra/ui";
import { MIN_ISO_DATE, type TemplateId } from "@nyaypatra/core";
import { PacketPlain } from "@/components/packet/packet-plain";
import { fill } from "@/lib/i18n/define";
import type { UiLocale } from "@/lib/i18n/locale";
import type { IntakeStrings } from "@/lib/i18n/messages/intake";
import type { PacketStrings } from "@/lib/i18n/messages/packet";
import { errorMessage } from "@/lib/intake/errors";
import { DEADLINE_DAYS, FIELD_NAMES, LIMITS, type FieldName, type FormErrors, type RawIntake } from "@/lib/intake/fields";
import { defaultRaw, formConfig, needsCompanyName } from "@/lib/intake/form-config";
import { PLATFORM_NAMES } from "@/lib/intake/platforms";
import type { SubmitState } from "@/lib/intake/result";
import { validateIntakeForm } from "@/lib/intake/validate";

export interface IntakeFormProps {
  templateId: TemplateId;
  locale: UiLocale;
  strings: IntakeStrings;
  packetStrings: PacketStrings;
  /** The fixed disclaimer (PRD F6), shown directly above the submit button. */
  disclaimer: string;
  /** The latest date a payment can have (today in IST). Comes from the server so both sides agree. */
  today: string;
  action: (previous: SubmitState, formData: FormData) => Promise<SubmitState>;
}

const IDLE: SubmitState = { status: "idle" };

/**
 * The moment the validator should treat as "now". The validator reads the IST calendar date off it, so noon IST
 * on the server's `today` gives exactly that date, whatever timezone or (wrong) clock this device has.
 */
function serverNow(today: string): Date | undefined {
  const moment = new Date(`${today}T12:00:00+05:30`);
  return Number.isNaN(moment.getTime()) ? undefined : moment;
}

export function IntakeForm({ templateId, locale, strings: t, packetStrings, disclaimer, today, action }: IntakeFormProps) {
  const config = formConfig(templateId);
  const [values, setValues] = useState<RawIntake>(() => defaultRaw(config));
  const [errors, setErrors] = useState<FormErrors>({});
  const [state, formAction, pending] = useActionState(action, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  // The server checks everything again; what it finds shows up in the same places as our own errors.
  useEffect(() => {
    if (state.status === "invalid") setErrors(state.errors);
  }, [state]);

  function setField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function focusFirst(found: FormErrors) {
    const first = FIELD_NAMES.find((name) => found[name]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] textarea`)?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = validateIntakeForm(templateId, values, serverNow(today));
    if (!result.ok) {
      setErrors(result.errors);
      focusFirst(result.errors);
      return;
    }
    setErrors({});
    const data = new FormData();
    data.set("templateId", templateId);
    for (const name of FIELD_NAMES) data.set(name, values[name]);
    startTransition(() => formAction(data));
  }

  if (state.status === "unsaved") {
    return (
      <div className="flex flex-col gap-6">
        <div role="alert" className="rounded-card border-[3px] border-ink bg-butter p-4 shadow-hard">
          <h2 className="font-display text-xl font-extrabold tracking-tight">{packetStrings.unsaved.title}</h2>
          <p className="mt-1 text-base font-medium">{packetStrings.unsaved.body}</p>
        </div>
        <PacketPlain packet={state.packet} locale={locale} strings={packetStrings} />
      </div>
    );
  }

  const error = (name: FieldName): string | undefined => {
    const code = errors[name];
    return code ? errorMessage(code, name, t) : undefined;
  };
  const platformLabel = {
    ecommerce: t.labels.platformEcommerce,
    upi: t.labels.platformUpi,
    food: t.labels.platformFood,
    hidden_fee: t.labels.platformHiddenFee,
  }[config.category];
  // The UTR has no field in this version, so a UPI payer may type it into the free text, which is stored. Say not to.
  const upiNoUtrId = config.category === "upi" ? "field-whatHappened-upi-note" : undefined;
  const deadlineLabels = { "2": t.deadlines.d2,"7": t.deadlines.d7, "15": t.deadlines.d15 };
  const problem =
    state.status === "rate_limited"
      ? t.form.rateLimited
      : state.status === "error"
        ? t.form.serverError
        : Object.keys(errors).length > 0
          ? t.form.fixErrors
          : undefined;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup id="field-platform" data-field="platform" label={platformLabel} error={error("platform")}>
        <ChipGroup
          name="platform"
          legend={platformLabel}
          value={values.platform || undefined}
          onValueChange={(value) => setField("platform", value)}
          options={config.platforms.map((platform) => ({
            value: platform,
            label: platform === "other" ? t.labels.platformOther : PLATFORM_NAMES[platform],
          }))}
        />
      </FieldGroup>

      {needsCompanyName(config, values.platform) ? (
        <Field
          id="field-companyName"
          data-field="companyName"
          label={config.companyNameAlways ? t.labels.paidTo : t.labels.companyName}
          error={error("companyName")}
        >
          {(control) => (
            <Input
              {...control}
              name="companyName"
              autoComplete="off"
              placeholder={t.placeholders.companyName}
              value={values.companyName}
              onChange={(event) => setField("companyName", event.target.value)}
            />
          )}
        </Field>
      ) : null}

      {config.showOrderId ? (
        <Field id="field-orderId" data-field="orderId" label={t.labels.orderId} optionalLabel={t.optional} hint={t.hints.orderId} error={error("orderId")}>
          {(control) => (
            <Input {...control} name="orderId" autoComplete="off" value={values.orderId} onChange={(event) => setField("orderId", event.target.value)} />
          )}
        </Field>
      ) : null}

      <Field id="field-amountInr" data-field="amountInr" label={t.labels.amountInr} hint={t.hints.amountInr} error={error("amountInr")}>
        {(control) => <MoneyField {...control} name="amountInr" value={values.amountInr} onChange={(event) => setField("amountInr", event.target.value)} />}
      </Field>

      {config.showListedPrice ? (
        <Field id="field-listedPriceInr" data-field="listedPriceInr" label={t.labels.listedPriceInr} hint={t.hints.listedPriceInr} error={error("listedPriceInr")}>
          {(control) => (
            <MoneyField {...control} name="listedPriceInr" value={values.listedPriceInr} onChange={(event) => setField("listedPriceInr", event.target.value)} />
          )}
        </Field>
      ) : null}

      <Field id="field-paidOn" data-field="paidOn" label={t.labels.paidOn} error={error("paidOn")}>
        {(control) => (
          <DateField {...control} name="paidOn" min={MIN_ISO_DATE} max={today} value={values.paidOn} onChange={(event) => setField("paidOn", event.target.value)} />
        )}
      </Field>

      {config.showDeliveredOn ? (
        <Field id="field-deliveredOn" data-field="deliveredOn" label={t.labels.deliveredOn} optionalLabel={t.optional} hint={t.hints.deliveredOn} error={error("deliveredOn")}>
          {(control) => (
            <DateField {...control} name="deliveredOn" min={MIN_ISO_DATE} max={today} value={values.deliveredOn} onChange={(event) => setField("deliveredOn", event.target.value)} />
          )}
        </Field>
      ) : null}

      <Field id="field-whatHappened" data-field="whatHappened" label={t.labels.whatHappened} hint={t.hints.whatHappened} error={error("whatHappened")}>
        {(control) => (
          <>
            <Textarea
              {...control}
              aria-describedby={[control["aria-describedby"], upiNoUtrId].filter(Boolean).join(" ") || undefined}
              name="whatHappened"
              rows={5}
              placeholder={t.placeholders.whatHappened}
              value={values.whatHappened}
              onChange={(event) => setField("whatHappened", event.target.value)}
            />
            <p className="mt-1 text-sm font-medium">{fill(t.counter, { count: values.whatHappened.length, max: LIMITS.whatHappened.max })}</p>
            {upiNoUtrId ? (
              <p id={upiNoUtrId} className="mt-1 text-sm font-bold">
                {t.hints.upiNoUtr}
              </p>
            ) : null}
          </>
        )}
      </Field>

      <Field id="field-alreadyDid" data-field="alreadyDid" label={t.labels.alreadyDid} optionalLabel={t.optional} hint={t.hints.alreadyDid} error={error("alreadyDid")}>
        {(control) => (
          <Textarea
            {...control}
            name="alreadyDid"
            rows={2}
            className="min-h-20"
            placeholder={t.placeholders.alreadyDid}
            value={values.alreadyDid}
            onChange={(event) => setField("alreadyDid", event.target.value)}
          />
        )}
      </Field>

      {config.remedies.length > 1 ? (
        <FieldGroup id="field-desiredRemedy" data-field="desiredRemedy" label={t.labels.desiredRemedy} error={error("desiredRemedy")}>
          <ChipGroup
            name="desiredRemedy"
            legend={t.labels.desiredRemedy}
            value={values.desiredRemedy}
            onValueChange={(value) => setField("desiredRemedy", value)}
            options={config.remedies.map((remedy) => ({ value: remedy, label: t.remedies[remedy] }))}
          />
        </FieldGroup>
      ) : (
        <div>
          <p className="mb-1.5 font-display text-sm font-extrabold">{t.labels.remedyFixed}</p>
          <p className="rounded-field border-2 border-ink bg-mint px-3 py-2 text-base font-bold">{t.remedies[config.remedies[0]]}</p>
        </div>
      )}

      <FieldGroup id="field-deadlineDays" data-field="deadlineDays" label={t.labels.deadlineDays} hint={t.hints.deadlineDays} error={error("deadlineDays")}>
        <ChipGroup
          name="deadlineDays"
          legend={t.labels.deadlineDays}
          value={values.deadlineDays}
          onValueChange={(value) => setField("deadlineDays", value)}
          options={DEADLINE_DAYS.map((days) => ({ value: String(days), label: deadlineLabels[String(days) as keyof typeof deadlineLabels] }))}
        />
      </FieldGroup>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="field-city" data-field="city" label={t.labels.city} optionalLabel={t.optional} hint={t.hints.city} error={error("city")}>
          {(control) => (
            <Input {...control} name="city" autoComplete="address-level2" placeholder={t.placeholders.city} value={values.city} onChange={(event) => setField("city", event.target.value)} />
          )}
        </Field>
        <Field id="field-userDisplayName" data-field="userDisplayName" label={t.labels.userDisplayName} optionalLabel={t.optional} hint={t.hints.userDisplayName} error={error("userDisplayName")}>
          {(control) => (
            <Input
              {...control}
              name="userDisplayName"
              autoComplete="name"
              placeholder={t.placeholders.userDisplayName}
              value={values.userDisplayName}
              onChange={(event) => setField("userDisplayName", event.target.value)}
            />
          )}
        </Field>
      </div>

      <div aria-live="polite">
        {problem ? (
          <p className="rounded-field border-[2.5px] border-ink bg-white px-3 py-2 text-base font-bold shadow-hard-sm">{problem}</p>
        ) : null}
      </div>

      <div className="rounded-card border-[3px] border-ink bg-butter p-4">
        <p className="text-sm font-bold">{disclaimer}</p>
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? t.form.submitting : t.form.submit}
      </Button>
    </form>
  );
}
