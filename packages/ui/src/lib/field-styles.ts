/** Shared look of text-like fields: chunky ink border, hard shadow, green focus ring, tomato when invalid. */
export const fieldBase = [
  "w-full min-h-12 rounded-field border-[2.5px] border-ink bg-white px-3 py-2",
  "text-[15px] font-bold shadow-hard",
  "placeholder:font-medium placeholder:text-ink/40",
  "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-wa",
  "aria-[invalid=true]:border-tomato aria-[invalid=true]:shadow-[4px_4px_0_var(--color-tomato)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");
