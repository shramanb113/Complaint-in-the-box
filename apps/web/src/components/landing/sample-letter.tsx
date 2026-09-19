"use client";

import { ChatBubble, CopyButton, DeadlineTag, Tabs, TabsContent, TabsList, TabsTrigger } from "@nyaypatra/ui";

interface SampleLetterProps {
  whatsapp: { en: string; hi: string };
  deadlineLabel: string;
  deadlineDays: number;
}

/** The hero demo: a real generated message with a language switch and a working Copy button. */
export function SampleLetter({ whatsapp, deadlineLabel, deadlineDays }: SampleLetterProps) {
  return (
    <div className="rounded-card border-[3px] border-ink bg-white p-4 shadow-hard-lg">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs font-bold uppercase tracking-wide">Sample: wrong item delivered</p>
        <DeadlineTag>
          Reply by {deadlineLabel} · {deadlineDays} days
        </DeadlineTag>
      </div>
      <Tabs defaultValue="en">
        <TabsList aria-label="Letter language">
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="hi" lang="hi">
            हिन्दी
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en">
          <ChatBubble time="10:42">{whatsapp.en}</ChatBubble>
          <CopyButton className="mt-3 w-full sm:w-auto" text={whatsapp.en} idleLabel="Copy message" doneLabel="Copied ✓" />
        </TabsContent>
        <TabsContent value="hi" lang="hi">
          <ChatBubble time="10:42">{whatsapp.hi}</ChatBubble>
          <CopyButton className="mt-3 w-full sm:w-auto" text={whatsapp.hi} idleLabel="संदेश कॉपी करें" doneLabel="कॉपी हो गया ✓" />
        </TabsContent>
      </Tabs>
      <p className="mt-3 text-sm font-medium">Made-up order details. Your letter uses your own.</p>
    </div>
  );
}
