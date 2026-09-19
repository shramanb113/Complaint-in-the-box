import { describe, it, expect } from "vitest";
import { placeholders } from "../src/lib/i18n/define";
import { ALL_MESSAGES } from "../src/lib/i18n/messages";

interface Leaf {
  path: string;
  value: string;
}

function leaves(node: unknown, path = ""): Leaf[] {
  if (typeof node === "string") return [{ path, value: node }];
  if (Array.isArray(node)) return node.flatMap((item, index) => leaves(item, `${path}[${index}]`));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key));
  }
  throw new Error(`Unsupported value at "${path}": messages may only hold strings, arrays and objects`);
}

const DEVANAGARI = /[ऀ-ॿ]/;
const EMOJI = /\p{Emoji_Presentation}/u;
const byPath = (a: Leaf, b: Leaf) => a.path.localeCompare(b.path);

describe.each(Object.entries(ALL_MESSAGES))("messages: %s", (_name, bilingual) => {
  const en = leaves(bilingual.en).sort(byPath);
  const hi = leaves(bilingual.hi).sort(byPath);

  it("has the same keys and the same array lengths in both languages", () => {
    expect(hi.map((leaf) => leaf.path)).toEqual(en.map((leaf) => leaf.path));
  });

  it("has no empty strings", () => {
    for (const leaf of [...en, ...hi]) expect(leaf.value.trim(), leaf.path).not.toBe("");
  });

  it("writes every Hindi string in Devanagari and no English string in it", () => {
    for (const leaf of hi) expect(leaf.value, leaf.path).toMatch(DEVANAGARI);
    for (const leaf of en) expect(leaf.value, leaf.path).not.toMatch(DEVANAGARI);
  });

  it("uses the same {placeholders} in both languages", () => {
    hi.forEach((leaf, index) => {
      expect(placeholders(leaf.value), leaf.path).toEqual(placeholders(en[index].value));
    });
  });

  it("contains no emoji", () => {
    for (const leaf of [...en, ...hi]) expect(leaf.value, leaf.path).not.toMatch(EMOJI);
  });
});
