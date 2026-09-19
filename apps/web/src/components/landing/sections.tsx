import type { ReactNode } from "react";

function SectionTitle({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-1 font-mono text-xs font-bold uppercase tracking-wide">{kicker}</p>
      <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{children}</h2>
    </div>
  );
}

const DELIVERABLES = [
  {
    tag: "01 · Paste it",
    title: "The chat message",
    body: "Short and clear, under 700 characters. Paste it into the app's support chat or send it on WhatsApp.",
    tone: "bg-peach",
  },
  {
    tag: "02 · Send it",
    title: "The formal email",
    body: "The facts, what you want and a reply date, in one email. It leaves a dated record if the chat goes quiet.",
    tone: "bg-mint",
  },
  {
    tag: "03 · File it",
    title: "The portal fields",
    body: "What to type in each box on the company's complaint page or the National Consumer Helpline form.",
    tone: "bg-butter",
  },
];

export function WhatYouGet() {
  return (
    <section aria-labelledby="what-you-get">
      <SectionTitle kicker="Three things, one form">
        <span id="what-you-get">What you get</span>
      </SectionTitle>
      <ul className="grid gap-5 md:grid-cols-3">
        {DELIVERABLES.map((item) => (
          <li
            key={item.title}
            className={`${item.tone} rounded-card border-[2.5px] border-ink p-5 shadow-hard transition-[transform,box-shadow] duration-[120ms] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-hard-lg`}
          >
            <p className="mb-3 font-mono text-xs font-bold">{item.tag}</p>
            <h3 className="mb-2 font-display text-xl font-extrabold tracking-tight">{item.title}</h3>
            <p className="text-base font-medium">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  {
    title: "Pick your problem",
    body: "Wrong or damaged item, refund not received, UPI money stuck, missing food, or a fee nobody told you about.",
  },
  {
    title: "Answer a few questions",
    body: "The amount, the date and what happened. Only facts, in your own words, in English or Hindi.",
  },
  {
    title: "Copy and send",
    body: "Try the app chat first, then the email, then the portal. Keep the dates: they are your record.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works">
      <SectionTitle kicker="About two minutes">
        <span id="how-it-works">How it works</span>
      </SectionTitle>
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => (
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

const PROMISES = [
  { title: "Free. No login.", body: "Nothing to sign up for." },
  { title: "Your UTR stays on your phone.", body: "It is added to the letter in your browser and never sent to us." },
  { title: "English and Hindi.", body: "Pick the language the company will read." },
  { title: "A drafting tool, not a law firm.", body: "No legal advice, and no promise of a refund. It makes your case clear and dated." },
];

export function Promises() {
  return (
    <section
      aria-labelledby="promises"
      className="rounded-card border-[3px] border-ink bg-turmeric p-5 shadow-hard-lg sm:p-8"
    >
      <h2 id="promises" className="mb-5 font-display text-3xl font-extrabold leading-tight tracking-tight">
        Plain promises
      </h2>
      <ul className="grid gap-5 sm:grid-cols-2">
        {PROMISES.map((promise) => (
          <li key={promise.title}>
            <h3 className="font-display text-lg font-extrabold tracking-tight">{promise.title}</h3>
            <p className="text-base font-medium">{promise.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
