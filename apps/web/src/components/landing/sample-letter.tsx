"use client";

import { ChatBubble, CopyButton, DeadlineTag, Tabs, TabsContent, TabsList, TabsTrigger } from "@nyaypatra/ui";
import type { UiLocale } from "@/lib/i18n/locale";

interface SampleLetterProps {
  /** The site language: picks which letter is open first. */
  locale: UiLocale;
  whatsapp: { en: string; hi: string };
  /** Already in the site language; the deadline text is filled in by the server. */
  labels: { sample: string; deadline: string; tablist: string; caption: string };
}

/** The hero demo: a real generated message with a language switch and a working Copy button. */
export function SampleLetter({ locale, whatsapp, labels }: SampleLetterProps) {
  return (
    <div className="rounded-card border-[3px] border-ink bg-white p-4 shadow-hard-lg">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs hi:text-sm font-bold uppercase tracking-wide">{labels.sample}</p>
        <DeadlineTag>{labels.deadline}</DeadlineTag>
      </div>
      {/* key: a language change re-renders this in place, so reset to the new language's tab. */}
      <Tabs key={locale} defaultValue={locale}>
        <TabsList aria-label={labels.tablist}>
          <TabsTrigger value="en" lang="en">
            English
          </TabsTrigger>
          <TabsTrigger value="hi" lang="hi">
            हिन्दी
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en" lang="en">
          <ChatBubble time="10:42">{whatsapp.en}</ChatBubble>
          <CopyButton className="mt-3 w-full sm:w-auto" text={whatsapp.en} idleLabel="Copy message" doneLabel="Copied ✓" />
        </TabsContent>
        <TabsContent value="hi" lang="hi">
          <ChatBubble time="10:42">{whatsapp.hi}</ChatBubble>
          <CopyButton className="mt-3 w-full sm:w-auto" text={whatsapp.hi} idleLabel="संदेश कॉपी करें" doneLabel="कॉपी हो गया ✓" />
        </TabsContent>
      </Tabs>
      <p className="mt-3 text-sm font-medium">{labels.caption}</p>
    </div>
  );
}
