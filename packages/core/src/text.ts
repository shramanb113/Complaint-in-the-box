let segmenter: Intl.Segmenter | null | undefined;

/** User-perceived characters. Falls back to code points where Intl.Segmenter is missing (browsers before 2024). */
function characters(text: string): string[] {
  if (segmenter === undefined) {
    segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  }
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text);
}

/**
 * The longest prefix of at most `maxLength` UTF-16 code units that ends on a whole character.
 * A plain `slice` can cut a Devanagari conjunct (क्ष), a vowel sign (कि) or an emoji sequence in half,
 * which prints as a broken glyph.
 */
export function truncateGraphemes(text: string, maxLength: number): string {
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  let out = "";
  for (const character of characters(text)) {
    if (out.length + character.length > maxLength) break;
    out += character;
  }
  return out;
}
