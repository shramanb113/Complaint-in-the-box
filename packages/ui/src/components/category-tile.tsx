"use client";

import * as React from "react";
import { cn } from "../lib/cn";

const TONES = {
  peach: "bg-peach",
  mint: "bg-mint",
  butter: "bg-butter",
  sky: "bg-sky",
} as const;

export interface CategoryTileProps {
  name: string;
  value: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onSelect: (value: string) => void;
  tone?: keyof typeof TONES;
  className?: string;
}

/**
 * A large single-choice tile on a native radio input, so keyboard and screen readers work.
 * Put several inside an element with role="radiogroup" and an accessible name.
 */
export function CategoryTile({
  name,
  value,
  title,
  description,
  icon,
  checked,
  onSelect,
  tone = "peach",
  className,
}: CategoryTileProps) {
  return (
    <label className={cn("relative block cursor-pointer", className)}>
      <input
        type="radio"
        className="peer sr-only"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
      />
      <span
        className={cn(
          "flex h-full min-h-11 flex-col gap-3 rounded-card border-[3px] border-ink p-4 shadow-hard",
          "transition-[transform,box-shadow] duration-[120ms] ease-out",
          "motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 hover:shadow-hard-lg",
          "peer-checked:shadow-none peer-checked:hover:shadow-none",
          "motion-safe:peer-checked:translate-x-1 motion-safe:peer-checked:translate-y-1",
          "motion-safe:peer-checked:hover:translate-x-1 motion-safe:peer-checked:hover:translate-y-1",
          "peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wa",
          TONES[tone]
        )}
      >
        <span aria-hidden="true" className="flex size-12 items-center justify-center">
          {icon}
        </span>
        <span className="font-display text-lg font-extrabold leading-tight tracking-tight">{title}</span>
        <span className="text-sm font-medium">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className="absolute right-3 top-3 hidden size-7 items-center justify-center rounded-full border-[2.5px] border-ink bg-wa font-display text-sm font-extrabold peer-checked:flex"
      >
        ✓
      </span>
    </label>
  );
}
