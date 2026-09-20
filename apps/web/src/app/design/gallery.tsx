"use client";

import * as React from "react";
import {
  Button,
  CategoryTile,
  ChatBubble,
  ChipGroup,
  CopyButton,
  DateField,
  DeadlineTag,
  Field,
  FieldGroup,
  Input,
  Label,
  MoneyField,
  Sticker,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@nyaypatra/ui";
import { CATEGORY_ICON } from "@/components/icons";

const COLORS = [
  { name: "cream", className: "bg-cream" },
  { name: "ink", className: "bg-ink" },
  { name: "turmeric", className: "bg-turmeric" },
  { name: "wa", className: "bg-wa" },
  { name: "tomato", className: "bg-tomato" },
  { name: "sky", className: "bg-sky" },
  { name: "peach", className: "bg-peach" },
  { name: "mint", className: "bg-mint" },
  { name: "butter", className: "bg-butter" },
  { name: "chat", className: "bg-chat" },
  { name: "chat-bg", className: "bg-chat-bg" },
];

const SHADOWS = ["shadow-hard-sm", "shadow-hard", "shadow-hard-lg", "shadow-hard-xl"];

const SAMPLE_LETTER =
  "Order OD1234, Flipkart, paid ₹2,499 on 10 Sep 2026.\nDelivered 14 Sep 2026: wrong item, cracked blade.\n\nI want a pickup of the wrong item and a full refund to my original payment mode.\n\nPlease confirm in writing by 26 Sep 2026.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function Gallery() {
  const [platform, setPlatform] = React.useState<string | undefined>("flipkart");
  const [category, setCategory] = React.useState<string | undefined>("ecommerce");

  return (
    <div className="mx-auto max-w-[960px]">
      <h1 className="mb-1 font-display text-4xl font-extrabold tracking-tighter">Design system</h1>
      <p className="mb-8 text-sm font-medium">Poster Pop tokens and components. Internal page — not linked from the site.</p>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLORS.map((color) => (
            <div key={color.name} className="rounded-card border-[2.5px] border-ink bg-white p-2 shadow-hard-sm">
              <div className={`h-12 rounded-md border-2 border-ink ${color.className}`} />
              <p className="mt-1 font-mono text-xs font-bold">{color.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Hard shadows">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {SHADOWS.map((shadow) => (
            <div key={shadow} className={`rounded-card border-[2.5px] border-ink bg-white p-4 font-mono text-xs font-bold ${shadow}`}>
              {shadow}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <p className="font-display text-5xl font-extrabold leading-[0.95] tracking-tighter">Wrong item. Refund stuck.</p>
        <p className="mt-2 text-base font-medium">Body — Bricolage Grotesque. Only facts. We&apos;ll turn them into the letter.</p>
        <p lang="hi" className="font-display mt-4 text-3xl font-extrabold">
          आपका पत्र तैयार है।
        </p>
        <p lang="hi" className="mt-1 text-base">
          हिंदी बॉडी टेक्स्ट — Mukta। पहले कंपनी की चैट पर भेजें। अक्सर यही सबसे तेज़ रास्ता है।
        </p>
        <p className="mt-4 font-mono text-sm font-bold">Mono — Space Mono · ₹2,499 · 26 Sep 2026</p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-4">
          <Button>Make my letter →</Button>
          <Button variant="accent">Copied ✓</Button>
          <Button variant="secondary">Send on WhatsApp ↗</Button>
          <Button variant="danger">Delete</Button>
          <Button disabled>Disabled</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Form">
        <div className="grid gap-4 sm:max-w-md">
          <div>
            <p className="mb-1.5 block font-display text-sm font-extrabold">Where did you order?</p>
            <ChipGroup
              name="platform"
              legend="Where did you order?"
              value={platform}
              onValueChange={setPlatform}
              options={[
                { value: "flipkart", label: "Flipkart" },
                { value: "amazon", label: "Amazon" },
                { value: "meesho", label: "Meesho" },
                { value: "other", label: "Other…" },
              ]}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount paid</Label>
            <Input id="amount" inputMode="numeric" placeholder="₹ 2,499" />
          </div>
          <div>
            <Label htmlFor="order">Order ID (optional)</Label>
            <Input id="order" aria-invalid="true" defaultValue="OD??" />
            <p className="mt-1 text-xs font-bold text-ink">Invalid state shown above</p>
          </div>
          <div>
            <Label htmlFor="what">What happened?</Label>
            <Textarea id="what" placeholder="Only facts, in your own words." />
          </div>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid gap-5 sm:max-w-md">
          <Field id="demo-name" label="Your name" optionalLabel="(optional)" hint="Printed as the sender.">
            {(control) => <Input {...control} placeholder="For example: Asha Patil" />}
          </Field>
          <Field id="demo-amount" label="Amount you paid" error="Use numbers only, for example 2499.">
            {(control) => <MoneyField {...control} defaultValue="24x9" />}
          </Field>
          <Field id="demo-date" label="Date you paid">
            {(control) => <DateField {...control} min="2016-01-01" />}
          </Field>
          <FieldGroup id="demo-platform" label="Where did you order?" hint="Pick one.">
            <ChipGroup
              name="demo-platform"
              legend="Where did you order?"
              value={platform}
              onValueChange={setPlatform}
              options={[
                { value: "flipkart", label: "Flipkart" },
                { value: "amazon", label: "Amazon" },
                { value: "other", label: "Other" },
              ]}
            />
          </FieldGroup>
        </div>
      </Section>

      <Section title="Category tiles">
        <div role="radiogroup" aria-label="Type of problem" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              { value: "ecommerce", title: "Online shopping", description: "Wrong, damaged or missing orders", tone: "peach" },
              { value: "upi", title: "UPI payment", description: "Money debited but not received", tone: "mint" },
              { value: "food", title: "Food delivery", description: "Missing or wrong items", tone: "butter" },
              { value: "hidden_fee", title: "Hidden charges", description: "Extra charges shown only at payment", tone: "sky" },
            ] as const
          ).map((tile) => {
            const Icon = CATEGORY_ICON[tile.value];
            return (
              <CategoryTile
                key={tile.value}
                name="category"
                value={tile.value}
                title={tile.title}
                description={tile.description}
                tone={tile.tone}
                icon={<Icon />}
                checked={category === tile.value}
                onSelect={setCategory}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="whatsapp" className="sm:max-w-md">
          <TabsList aria-label="Letter format">
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="email">Email + PDF</TabsTrigger>
            <TabsTrigger value="portal">Portal</TabsTrigger>
          </TabsList>
          <TabsContent value="whatsapp">WhatsApp text goes here.</TabsContent>
          <TabsContent value="email">Subject, body and PDF go here.</TabsContent>
          <TabsContent value="portal">Portal paste map goes here.</TabsContent>
        </Tabs>
      </Section>

      <Section title="Chat bubble, tags, sticker, copy">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-4">
            <ChatBubble time="10:42">{SAMPLE_LETTER}</ChatBubble>
            <CopyButton text={SAMPLE_LETTER} idleLabel="Copy message" doneLabel="Copied ✓" />
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <DeadlineTag tone="ready">Ready ✓</DeadlineTag>
            <DeadlineTag>Reply by 26 Sep · 7 days</DeadlineTag>
            <Sticker>
              Free.
              <br />
              Always.
            </Sticker>
          </div>
        </div>
      </Section>
    </div>
  );
}
