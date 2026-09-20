"use client";

import { useState } from "react";
import Link from "next/link";
import { CategoryTile } from "@nyaypatra/ui";
import type { Category, TemplateId } from "@nyaypatra/core";
import { CATEGORY_ICON } from "@/components/icons";

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
  notSure: string;
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
  notSure,
  categories,
  templates,
}: CategoryPickerProps) {
  const [selected, setSelected] = useState<Category | undefined>(undefined);

  return (
    <section id="start" aria-labelledby="picker-title" className="scroll-mt-24">
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs font-bold uppercase tracking-wide">{kicker}</p>
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
            <ul className="grid gap-3 sm:grid-cols-2">
              {templates[selected].map((template) => (
                <li key={template.id}>
                  <Link
                    href={`/new/${selected}?template=${template.id}`}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-xl border-[2.5px] border-ink bg-white px-4 py-3 font-bold shadow-hard-sm transition-[transform,box-shadow] duration-[120ms] motion-safe:hover:-translate-x-px motion-safe:hover:-translate-y-px hover:shadow-hard"
                  >
                    <span>{template.label}</span>
                    <span aria-hidden="true" className="font-display text-lg font-extrabold">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Link
                href={`/new/${selected}`}
                className="inline-flex min-h-11 items-center text-sm font-extrabold underline decoration-2 underline-offset-4 hover:decoration-turmeric"
              >
                {notSure}
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
