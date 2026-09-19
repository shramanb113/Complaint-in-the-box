"use client";

import { cn } from "../lib/cn";

export interface ChipGroupProps {
  name: string;
  /** Accessible name of the group (visually hidden; pair with a visible <Label>). */
  legend: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

/** Single-select pill chips built on native radio inputs (keyboard + screen-reader friendly). */
export function ChipGroup({ name, legend, value, onValueChange, options, className }: ChipGroupProps) {
  return (
    <div role="radiogroup" aria-label={legend} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input
            type="radio"
            className="peer sr-only"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onValueChange(option.value)}
          />
          <span
            className={cn(
              "inline-flex min-h-11 items-center rounded-chip border-2 border-ink bg-white px-4 text-sm font-extrabold",
              "shadow-hard-sm transition-[transform,box-shadow,background-color] duration-[120ms]",
              "motion-safe:hover:-translate-x-px motion-safe:hover:-translate-y-px",
              "peer-checked:bg-turmeric peer-checked:shadow-none",
              "motion-safe:peer-checked:translate-x-px motion-safe:peer-checked:translate-y-px",
              "peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wa"
            )}
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
