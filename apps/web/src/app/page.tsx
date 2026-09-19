import { Button, Sticker } from "@nyaypatra/ui";
import { buildSampleLetter } from "@/lib/sample-packet";
import { SampleLetter } from "@/components/landing/sample-letter";
import { HowItWorks, Promises, WhatYouGet } from "@/components/landing/sections";

// Staggered page-load entrance; the global reduced-motion rule flattens it to nothing.
const rise = (step: number) => ({ animationDelay: `${step * 90}ms` });

export default function HomePage() {
  const sample = buildSampleLetter();

  return (
    <main className="mx-auto flex max-w-[1040px] flex-col gap-16 px-4 py-10 sm:py-14">
      <section className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div className="flex flex-col items-start gap-6">
          <div className="motion-safe:animate-rise" style={rise(0)}>
            <Sticker>Coming soon</Sticker>
          </div>
          <h1
            className="font-display text-5xl font-extrabold leading-[0.95] tracking-tighter motion-safe:animate-rise sm:text-6xl"
            style={rise(1)}
          >
            A complaint they can&apos;t ignore.
          </h1>
          <p className="max-w-lg text-lg font-medium motion-safe:animate-rise" style={rise(2)}>
            Refund stuck? Answer a few questions and get the message to paste in the app chat, a formal email with a
            deadline, and the exact boxes to fill on the complaint portal. English and Hindi. Free, no login.
          </p>
          <div className="flex flex-col items-start gap-2 motion-safe:animate-rise" style={rise(3)}>
            <Button size="lg" disabled>
              Start my complaint
            </Button>
            <p className="text-sm font-medium">Opening soon. This is what the finished letter looks like.</p>
          </div>
        </div>
        <div className="motion-safe:animate-rise" style={rise(2)}>
          <SampleLetter {...sample} />
        </div>
      </section>

      <WhatYouGet />
      <HowItWorks />
      <Promises />

      <footer className="border-t-[3px] border-ink pt-6 text-sm font-medium">
        <p className="font-display text-base font-extrabold">Nyay Patra</p>
        <p className="mt-1 max-w-2xl">
          In development. Not affiliated with any shop, app or bank, and not a substitute for advice from a lawyer.
        </p>
      </footer>
    </main>
  );
}
