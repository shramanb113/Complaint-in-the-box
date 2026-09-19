const NAMED_PX: Record<string, number> = {
  "text-xs": 12,
  "text-sm": 14,
  "text-base": 16,
  "text-lg": 18,
  "text-xl": 20,
};

/**
 * The font size (px) a class string sets with a size utility, or undefined if it sets none.
 * Understands Tailwind's named sizes and arbitrary `text-[Npx]` values (the only forms used here).
 */
export function fontSizePx(className: string): number | undefined {
  for (const token of className.split(/\s+/)) {
    if (token in NAMED_PX) return NAMED_PX[token];
    const arbitrary = /^text-\[(\d+(?:\.\d+)?)px\]$/.exec(token);
    if (arbitrary) return Number(arbitrary[1]);
  }
  return undefined;
}
