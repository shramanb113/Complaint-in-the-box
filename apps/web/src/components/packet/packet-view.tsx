"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CopyButton } from "@nyaypatra/ui";
import { applyUtr, formatYMDEn, formatYMDHi, packetDeadline, type Packet } from "@nyaypatra/core";
import { UtrBox } from "@/components/packet/utr-box";
import { fill } from "@/lib/i18n/define";
import { track } from "@/lib/analytics/track";
import type { UiLocale } from "@/lib/i18n/locale";
import type { PacketStrings } from "@/lib/i18n/messages/packet";

export interface PacketViewProps {
  packet: Packet;
  locale: UiLocale;
  strings: PacketStrings;
  /** Ready-made "This link works until ..." line. Leave out when the letter was not saved. */
  expiresLine?: string;
  /** True for a packet just generated this request (saved or not); false for revisiting a saved link. */
  isNew: boolean;
}

const box = "whitespace-pre-wrap break-words rounded-field border-2 border-ink p-3 text-[15px] font-medium";

function PortalList({ fields }: { fields: Record<string, string> }) {
  return (
    <dl lang="en" className="grid gap-3">
      {Object.entries(fields).map(([label, value]) => (
        <div key={label}>
          <dt className="text-sm font-extrabold">{label}</dt>
          <dd className="break-words text-[15px] font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The one place a Packet becomes WhatsApp/email/portal content. `applyUtr` runs here, client-side,
 * with whatever the person has typed into UtrBox — the token never resolves on the server (D3).
 */
export function PacketView({ packet, locale, strings: t, expiresLine, isNew }: PacketViewProps) {
  const [utr, setUtr] = useState("");
  const generatedTracked = useRef(false);
  const isUpi = packet.intake.category === "upi";
  const { artifacts } = useMemo(() => applyUtr(packet, utr.trim() === "" ? undefined : utr), [packet, utr]);
  const format = locale === "hi" ? formatYMDHi : formatYMDEn;
  const languages: UiLocale[] = locale === "hi" ? ["hi", "en"] : ["en", "hi"];

  useEffect(() => {
    if (generatedTracked.current) return;
    generatedTracked.current = true;
    if (isNew) {
      track("packet_generated", { category: packet.intake.category, templateId: packet.intake.templateId });
      if (typeof window !== "undefined" && window.location.search.includes("new=1")) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      return;
    }
    const daysSinceCreated = Math.floor((Date.now() - new Date(packet.createdAt).getTime()) / 86_400_000);
    const pastDeadline = new Date() > new Date(`${packetDeadline(packet)}T23:59:59`);
    track("packet_revisited", { days_since_created: daysSinceCreated, past_deadline: pastDeadline });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <article lang={locale} className="mx-auto flex max-w-2xl flex-col gap-8">
      <header>
        <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight">{t.title}</h2>
        <p className="mt-2 text-base font-bold">{fill(t.deadline, { date: format(packetDeadline(packet)) })}</p>
        {expiresLine ? <p className="mt-1 text-base font-medium">{expiresLine}</p> : null}
      </header>

      {isUpi ? <UtrBox value={utr} onChange={setUtr} strings={t.utr} /> : null}

      {languages.map((lang) => (
        <section key={lang} aria-label={t.language[lang]} className="flex flex-col gap-4 rounded-card border-[3px] border-ink bg-white p-4 shadow-hard">
          <h3 className="font-display text-xl font-extrabold tracking-tight">
            {t.whatsapp} <span className="font-medium">({t.language[lang]})</span>
          </h3>
          <pre lang={lang} className={`${box} bg-chat`}>{artifacts.whatsapp[lang]}</pre>
          <CopyButton
            className="self-start"
            text={artifacts.whatsapp[lang]}
            idleLabel={t.copy}
            doneLabel={t.copied}
            onCopied={() => track("copy_clicked", { tab: "whatsapp", lang })}
          />

          <h3 className="font-display text-xl font-extrabold tracking-tight">
            {t.email} <span className="font-medium">({t.language[lang]})</span>
          </h3>
          <p className="-mb-2 text-sm font-extrabold">{t.subject}</p>
          <pre lang={lang} className={`${box} bg-cream`}>{artifacts.emailSubject[lang]}</pre>
          <CopyButton
            className="self-start"
            text={artifacts.emailSubject[lang]}
            idleLabel={t.copy}
            doneLabel={t.copied}
            onCopied={() => track("copy_clicked", { tab: "email_subject", lang })}
          />
          <p className="-mb-2 text-sm font-extrabold">{t.body}</p>
          <pre lang={lang} className={`${box} bg-cream`}>{artifacts.emailBody[lang]}</pre>
          <CopyButton
            className="self-start"
            text={artifacts.emailBody[lang]}
            idleLabel={t.copy}
            doneLabel={t.copied}
            onCopied={() => track("copy_clicked", { tab: "email_body", lang })}
          />
        </section>
      ))}

      <section aria-label={t.portal} className="flex flex-col gap-3 rounded-card border-[3px] border-ink bg-mint p-4 shadow-hard">
        <h3 className="font-display text-xl font-extrabold tracking-tight">{t.portal}</h3>
        <p className="text-base font-medium">{t.portalHelp}</p>
        <PortalList fields={artifacts.nchFields} />
      </section>

      {artifacts.bankFields ? (
        <section aria-label={t.bank} className="flex flex-col gap-3 rounded-card border-[3px] border-ink bg-sky p-4 shadow-hard">
          <h3 className="font-display text-xl font-extrabold tracking-tight">{t.bank}</h3>
          <PortalList fields={artifacts.bankFields} />
        </section>
      ) : null}

      <section aria-label={t.links}>
        <h3 className="mb-2 font-display text-xl font-extrabold tracking-tight">{t.links}</h3>
        <ul role="list" lang="en" className="grid gap-3">
          {artifacts.portalLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("portal_opened", { href: link.href })}
                className="inline-flex min-h-11 items-center font-extrabold underline decoration-2 underline-offset-4 hover:decoration-turmeric"
              >
                {link.label}
              </a>
              <p className="text-sm font-medium">{link.help}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={t.nextSteps}>
        <h3 className="mb-2 font-display text-xl font-extrabold tracking-tight">{t.nextSteps}</h3>
        <ol role="list" className="list-decimal space-y-2 pl-6 text-base font-medium">
          {artifacts.nextSteps[locale].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
