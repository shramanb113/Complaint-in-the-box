import type { ReactNode } from "react";
import { Kicker } from "@/components/kicker";
import type { UiLocale } from "@/lib/i18n/locale";
import { landingMessages } from "@/lib/i18n/messages/landing";

function SectionTitle({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <Kicker className="mb-1">{kicker}</Kicker>
      <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{children}</h2>
    </div>
  );
}

const CARD_TONES = ["bg-peach", "bg-mint", "bg-butter"] as const;

export function WhatYouGet({ locale }: { locale: UiLocale }) {
  const t = landingMessages[locale].whatYouGet;
  return (
    <section aria-labelledby="what-you-get">
      <SectionTitle kicker={t.kicker}>
        <span id="what-you-get">{t.title}</span>
      </SectionTitle>
      <ul role="list" className="grid gap-5 md:grid-cols-3">
        {t.items.map((item, index) => (
          <li
            key={item.title}
            className={`${CARD_TONES[index]} rounded-card border-[2.5px] border-ink p-5 shadow-hard transition-[translate,box-shadow] duration-[120ms] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-hard-lg`}
          >
            <p className="mb-3 font-mono text-xs hi:text-sm font-bold">{item.tag}</p>
            <h3 className="mb-2 font-display text-xl font-extrabold tracking-tight">{item.title}</h3>
            <p className="text-base font-medium">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks({ locale }: { locale: UiLocale }) {
  const t = landingMessages[locale].howItWorks;
  return (
    <section aria-labelledby="how-it-works">
      <SectionTitle kicker={t.kicker}>
        <span id="how-it-works">{t.title}</span>
      </SectionTitle>
      <ol role="list" className="grid gap-5 md:grid-cols-3">
        {t.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-turmeric font-display text-2xl font-extrabold shadow-hard-sm"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="mb-1 font-display text-xl font-extrabold tracking-tight">{step.title}</h3>
              <p className="text-base font-medium">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Promises({ locale }: { locale: UiLocale }) {
  const t = landingMessages[locale].promises;
  return (
    <section
      aria-labelledby="promises"
      className="rounded-card border-[3px] border-ink bg-turmeric p-5 shadow-hard-lg sm:p-8"
    >
      <h2 id="promises" className="mb-5 font-display text-3xl font-extrabold leading-tight tracking-tight">
        {t.title}
      </h2>
      <ul role="list" className="grid gap-5 sm:grid-cols-2">
        {t.items.map((promise) => (
          <li key={promise.title}>
            <h3 className="font-display text-lg font-extrabold tracking-tight">{promise.title}</h3>
            <p className="text-base font-medium">{promise.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
