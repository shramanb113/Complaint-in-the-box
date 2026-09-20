"use client";

import { useState } from "react";
import { CategoryTile } from "@nyaypatra/ui";
import type { Category, TemplateId } from "@nyaypatra/core";
import { CATEGORY_ICON } from "@/components/icons";
import { Kicker } from "@/components/kicker";
import { SituationLink } from "@/components/situation-link";

const TONE: Record<Category, "peach" | "mint" | "butter" | "sky"> = {
  ecommerce: "peach",
  upi: "mint",
  food: "butter",
  hidden_fee: "sky",
};

interface CategoryPickerProps {
  kicker: string;
  title: string;
  hint: string;
  legend: string;
  templatesHeading: string;
  categories: { id: Category; title: string; example: string }[];
  templates: Record<Category, { id: TemplateId; label: string }[]>;
}

/** Tap a kind of problem, then the situation that matches. Each situation links to /new/[category]?template=... */
export function CategoryPicker({
  kicker,
  title,
  hint,
  legend,
  templatesHeading,
  categories,
  templates,
}: CategoryPickerProps) {
  const [selected, setSelected] = useState<Category | undefined>(undefined);

  return (
    <section id="start" aria-labelledby="picker-title" className="scroll-mt-24">
      <div className="mb-6">
        <Kicker className="mb-1">{kicker}</Kicker>
        <h2 id="picker-title" className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-base font-medium">{hint}</p>
      </div>
      <div role="radiogroup" aria-label={legend} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = CATEGORY_ICON[category.id];
          return (
            <CategoryTile
              key={category.id}
              name="category"
              value={category.id}
              title={category.title}
              description={category.example}
              tone={TONE[category.id]}
              icon={<Icon />}
              checked={selected === category.id}
              onSelect={(value) => setSelected(value as Category)}
            />
          );
        })}
      </div>
      <div aria-live="polite">
        {selected ? (
          <div key={selected} className="mt-8 motion-safe:animate-rise">
            <h3 className="mb-3 font-display text-xl font-extrabold tracking-tight">{templatesHeading}</h3>
            <ul role="list" className="grid gap-3 sm:grid-cols-2">
              {templates[selected].map((template) => (
                <li key={template.id}>
                  <SituationLink href={`/new/${selected}?template=${template.id}`} label={template.label} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
