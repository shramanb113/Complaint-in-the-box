import { Button, Sticker } from "@nyaypatra/ui";
import { CategoryPicker } from "@/components/landing/category-picker";
import { SampleLetter } from "@/components/landing/sample-letter";
import { HowItWorks, Promises, WhatYouGet } from "@/components/landing/sections";
import { TrackOnMount } from "@/lib/analytics/track-on-mount";
import { CATEGORY_ORDER, templatesByCategory } from "@/lib/catalog";
import { fill } from "@/lib/i18n/define";
import { getLocale } from "@/lib/i18n/get-locale";
import { landingMessages } from "@/lib/i18n/messages/landing";
import { pickerMessages } from "@/lib/i18n/messages/picker";
import { buildSampleLetter } from "@/lib/sample-packet";

// Staggered page-load entrance; the global reduced-motion rule flattens it to nothing.
const rise = (step: number) => ({ animationDelay: `${step * 90}ms` });

export default async function HomePage() {
  const locale = await getLocale();
  const t = landingMessages[locale];
  const picker = pickerMessages[locale];
  const sample = buildSampleLetter();
  const grouped = templatesByCategory();

  return (
    <div className="flex flex-col gap-16">
      <TrackOnMount event="landing_view" />
      <section className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div className="flex flex-col items-start gap-6">
          <div className="motion-safe:animate-rise" style={rise(0)}>
            <Sticker className="hi:leading-tight">{t.sticker}</Sticker>
          </div>
          <h1
            className="font-display text-5xl font-extrabold leading-[0.95] tracking-tighter motion-safe:animate-rise hi:text-4xl hi:leading-[1.3] sm:text-6xl sm:hi:text-5xl"
            style={rise(1)}
          >
            {t.title}
          </h1>
          <p className="max-w-lg text-lg font-medium motion-safe:animate-rise" style={rise(2)}>
            {t.lead}
          </p>
          <div className="flex flex-col items-start gap-2 motion-safe:animate-rise" style={rise(3)}>
            <Button asChild size="lg">
              <a href="#start">{t.cta}</a>
            </Button>
            <p className="text-sm font-medium">{t.ctaNote}</p>
          </div>
        </div>
        <div className="motion-safe:animate-rise" style={rise(2)}>
          <SampleLetter
            locale={locale}
            whatsapp={sample.whatsapp}
            labels={{
              sample: t.sample.label,
              deadline: fill(t.sample.deadline, { date: sample.deadlineLabel[locale], days: sample.deadlineDays }),
              tablist: t.sample.tablist,
              caption: t.sample.caption,
            }}
          />
        </div>
      </section>

      <CategoryPicker
        kicker={picker.kicker}
        title={picker.title}
        hint={picker.hint}
        legend={picker.legend}
        templatesHeading={picker.templatesHeading}
        categories={CATEGORY_ORDER.map((id) => ({
          id,
          title: picker.categories[id].title,
          example: picker.categories[id].example,
        }))}
        templates={{
          ecommerce: grouped.ecommerce.map((id) => ({ id, label: picker.templates[id] })),
          upi: grouped.upi.map((id) => ({ id, label: picker.templates[id] })),
          food: grouped.food.map((id) => ({ id, label: picker.templates[id] })),
          hidden_fee: grouped.hidden_fee.map((id) => ({ id, label: picker.templates[id] })),
        }}
      />

      <WhatYouGet locale={locale} />
      <HowItWorks locale={locale} />
      <Promises locale={locale} />
    </div>
  );
}
