import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales. These are the project's own
 * `@theme` values from styles/theme.css; keep the two lists in sync. Without them,
 * `rounded-card rounded-lg` would not merge and `shadow-hard shadow-ink` would treat
 * `shadow-hard` as a shadow colour and drop it. (Colour tokens need no entry: colours
 * match any value.)
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["chip", "card", "field"],
      shadow: ["hard-sm", "hard", "hard-lg", "hard-xl"],
      ease: ["pop"],
      animate: ["pop", "wobble"],
    },
  },
});

/** Joins class names and resolves Tailwind conflicts (later wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
