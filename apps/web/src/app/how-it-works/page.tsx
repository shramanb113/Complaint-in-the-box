import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@nyaypatra/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { howItWorksMessages } from "@/lib/i18n/messages/how-it-works";

export async function generateMetadata(): Promise<Metadata> {
  return { title: howItWorksMessages[await getLocale()].title };
}

const inlineLink =
  "inline-flex min-h-11 items-center text-sm font-extrabold underline decoration-2 underline-offset-4 hover:decoration-turmeric";

export default async function HowItWorksPage() {
  const t = howItWorksMessages[await getLocale()];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <header>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter sm:text-5xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl text-lg font-medium">{t.intro}</p>
      </header>

      <ol role="list" className="flex flex-col gap-6">
        {t.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-turmeric font-display text-2xl font-extrabold shadow-hard-sm"
            >
              {index + 1}
            </span>
            <div>
              <h2 className="mb-1 font-display text-xl font-extrabold tracking-tight">{step.title}</h2>
              <p className="text-base font-medium">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-card border-[3px] border-ink bg-mint p-5 shadow-hard">
        <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight">{t.data.title}</h2>
        <ul className="list-disc space-y-1 pl-5 text-base font-medium">
          {t.data.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <Link href="/legal/privacy" className={`mt-2 ${inlineLink}`}>
          {t.data.link}
        </Link>
      </section>

      <section className="rounded-card border-[3px] border-ink bg-butter p-5 shadow-hard">
        <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight">{t.not.title}</h2>
        <p className="text-base font-medium">{t.not.body}</p>
        <Link href="/legal/disclaimer" className={`mt-2 ${inlineLink}`}>
          {t.not.link}
        </Link>
      </section>

      <Button asChild size="lg" className="self-start">
        <Link href="/#start">{t.cta}</Link>
      </Button>
    </div>
  );
}
