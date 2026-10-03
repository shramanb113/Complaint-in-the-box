"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ChatBubble, CopyButton, DeadlineTag, Tabs, TabsContent, TabsList, TabsTrigger } from "@nyaypatra/ui";
import { applyUtr, formatYMDEn, formatYMDHi, packetDeadline, ymdToIsoDate, type Packet } from "@nyaypatra/core";
import { FilingReady } from "@/components/packet/filing-ready";
import { UtrBox } from "@/components/packet/utr-box";
import { fill } from "@/lib/i18n/define";
import { track } from "@/lib/analytics/track";
import type { UiLocale } from "@/lib/i18n/locale";
import { filingMessages } from "@/lib/i18n/messages/filing";
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
  const [printingKit, setPrintingKit] = useState(false);
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
    const pastDeadline = new Date() > new Date(`${ymdToIsoDate(packetDeadline(packet))}T23:59:59`);
    track("packet_revisited", { days_since_created: daysSinceCreated, past_deadline: pastDeadline });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(artifacts.whatsapp[locale])}`;
  // Body is deliberately NOT the full letter: URL-encoded Hindi runs ~9,500 chars for a typical
  // letter (each Devanagari char -> %XX%XX%XX), well past the ~2,083 char mailto limit most
  // Windows/Outlook clients enforce, which silently truncates the deadline/escalation paragraph.
  // Full text goes to the clipboard on click instead; this note is a short, length-safe pointer.
  const mailHref = `mailto:?subject=${encodeURIComponent(artifacts.emailSubject[locale])}&body=${encodeURIComponent(t.emailMailtoNote)}`;
  const filenameDate = packet.createdAt.slice(0, 10);

  async function openEmail() {
    try {
      await navigator.clipboard.writeText(artifacts.emailBody[locale]);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the Copy button next to
      // this one covers that case, so the mailto note's instruction just goes unfulfilled.
    }
    track("email_opened", { lang: locale });
  }

  function downloadPdf() {
    const previousTitle = document.title;
    document.title = `nyaypatra-${packet.intake.platform}-${filenameDate}`;
    track("pdf_downloaded", { platform: packet.intake.platform });
    window.print();
    document.title = previousTitle;
  }

  return (
    <>
    <article lang={locale} className="mx-auto flex max-w-2xl flex-col gap-8 print:hidden">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight">{t.title}</h2>
          {expiresLine ? <p className="mt-1 text-base font-medium">{expiresLine}</p> : null}
        </div>
        <DeadlineTag tone="urgent">{fill(t.deadline, { date: format(packetDeadline(packet)) })}</DeadlineTag>
      </header>

      {isUpi ? <UtrBox value={utr} onChange={setUtr} strings={t.utr} /> : null}

      <Tabs defaultValue="whatsapp">
        <TabsList aria-label={t.title}>
          <TabsTrigger value="whatsapp">{t.tabLabels.whatsapp}</TabsTrigger>
          <TabsTrigger value="email">{t.tabLabels.email}</TabsTrigger>
          <TabsTrigger value="portal">{t.tabLabels.portal}</TabsTrigger>
          <TabsTrigger value="file">{filingMessages[locale].tab}</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="flex flex-col gap-6">
          {languages.map((lang) => (
            <div key={lang} className="flex flex-col gap-3">
              <p className="text-sm font-extrabold">{t.language[lang]}</p>
              <div lang={lang}>
                <ChatBubble>{artifacts.whatsapp[lang]}</ChatBubble>
              </div>
              <div className="flex flex-wrap gap-3">
                <CopyButton
                  text={artifacts.whatsapp[lang]}
                  idleLabel={t.copy}
                  doneLabel={t.copied}
                  onCopied={() => track("copy_clicked", { tab: "whatsapp", lang })}
                />
                {lang === locale ? (
                  <Button asChild variant="secondary">
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_opened", {})}>
                      {t.whatsappSend}
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="email" className="flex flex-col gap-6">
          {languages.map((lang) => (
            <div key={lang} className="flex flex-col gap-3">
              <p className="text-sm font-extrabold">{t.language[lang]}</p>
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
              <div className="flex flex-wrap gap-3">
                <CopyButton
                  text={artifacts.emailBody[lang]}
                  idleLabel={t.copy}
                  doneLabel={t.copied}
                  onCopied={() => track("copy_clicked", { tab: "email_body", lang })}
                />
                {lang === locale ? (
                  <Button asChild variant="secondary">
                    <a href={mailHref} onClick={openEmail}>
                      {t.emailOpen}
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <Button variant="accent" onClick={downloadPdf} className="self-start">
            {t.pdf.download}
          </Button>
        </TabsContent>

        <TabsContent value="portal" className="flex flex-col gap-6">
          <section aria-label={t.portal} className="flex flex-col gap-3">
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
        </TabsContent>

        <TabsContent value="file">
          <FilingReady
            packet={packet}
            locale={locale}
            strings={filingMessages[locale]}
            copy={{ idle: t.copy, done: t.copied }}
            onPrintKit={setPrintingKit}
          />
        </TabsContent>
      </Tabs>

      <section aria-label={t.nextSteps} className="flex flex-col gap-3">
        <h3 className="font-display text-xl font-extrabold tracking-tight">{t.nextSteps}</h3>
        <ol role="list" className="list-decimal space-y-2 pl-6 text-base font-medium">
          {artifacts.nextSteps[locale].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section aria-label={t.whatNext.title} className="flex flex-col gap-3 rounded-card border-[3px] border-ink bg-butter p-4 shadow-hard">
        <h3 className="font-display text-xl font-extrabold tracking-tight">{t.whatNext.title}</h3>
        <div className="flex flex-col gap-2">
          {(["escalate", "remind"] as const).map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => track("next_step_interest", { step })}
              className="flex min-h-11 flex-col items-start rounded-field border-2 border-ink bg-white px-3 py-2 text-left"
            >
              <span className="font-extrabold">{t.whatNext[step]}</span>
              <span className="text-sm font-medium">{t.whatNext.comingSoon}</span>
            </button>
          ))}
        </div>
      </section>
    </article>

    <div aria-hidden="true" className={printingKit ? "hidden" : "hidden print:block"}>
      <p className="mb-4 text-sm font-bold">{t.pdf.letterhead}</p>
      <pre className="whitespace-pre-wrap font-sans text-[13px]">{artifacts.emailBody[locale]}</pre>
    </div>
    </>
  );
}
