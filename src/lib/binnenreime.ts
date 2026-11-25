import {
  autoRhymeKeyForWord,
  normalizeWord,
  rhymeKeysMatch,
  type RhymeOverrides,
} from "./lyrics";

const STOPWORDS = new Set(
  [
    "ich",
    "du",
    "er",
    "sie",
    "es",
    "wir",
    "ihr",
    "man",
    "mein",
    "dein",
    "sein",
    "ihr",
    "uns",
    "euch",
    "der",
    "die",
    "das",
    "den",
    "dem",
    "des",
    "ein",
    "eine",
    "einer",
    "einem",
    "eines",
    "und",
    "oder",
    "aber",
    "als",
    "am",
    "an",
    "auf",
    "aus",
    "bei",
    "bis",
    "da",
    "dann",
    "denn",
    "doch",
    "für",
    "im",
    "in",
    "ist",
    "ja",
    "mit",
    "nach",
    "nicht",
    "noch",
    "nur",
    "ob",
    "so",
    "um",
    "und",
    "von",
    "vor",
    "was",
    "wer",
    "wie",
    "wo",
    "zu",
    "zum",
    "zur",
    "über",
    "a",
    "the",
    "to",
    "of",
    "and",
    "or",
    "in",
    "on",
    "my",
    "me",
    "i",
    "you",
    "it",
  ].map((w) => normalizeWord(w)),
);

export type InternalRhymeGroup = {
  key: string;
  words: string[];
};

/** Content tokens with original spelling preserved. */
function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((t) => t.replace(/^[^a-zA-ZäöüÄÖÜß]+|[^a-zA-ZäöüÄÖÜß]+$/g, ""))
    .filter(Boolean);
}

function wordKey(word: string, overrides: RhymeOverrides): string {
  const n = normalizeWord(word);
  if (overrides[n]) return overrides[n]!;
  return autoRhymeKeyForWord(n);
}

/**
 * Groups of words inside one line that share a phonetic rhyme class.
 * Example: "Bier … Tier … Pier … vier" → one group under key "ia".
 */
export function findInternalRhymes(
  text: string,
  overrides: RhymeOverrides = {},
): InternalRhymeGroup[] {
  const tokens = tokenize(text);
  const buckets = new Map<string, { display: string; norm: string }[]>();

  for (const token of tokens) {
    const norm = normalizeWord(token);
    if (norm.length < 3) continue;
    if (STOPWORDS.has(norm)) continue;
    const key = wordKey(token, overrides);
    if (!key || key.length < 2) continue;
    const list = buckets.get(key) ?? [];
    if (!list.some((x) => x.norm === norm)) {
      list.push({ display: token, norm });
    }
    buckets.set(key, list);
  }

  const groups: InternalRhymeGroup[] = [];
  for (const [key, words] of buckets) {
    if (words.length < 2) continue;
    // Soft-merge near-identical keys already handled by same key string
    groups.push({
      key,
      words: words.map((w) => w.display),
    });
  }

  // Also merge groups whose keys soft-match (rare after normalization)
  const merged: InternalRhymeGroup[] = [];
  for (const g of groups.sort((a, b) => b.words.length - a.words.length)) {
    const host = merged.find((m) => rhymeKeysMatch(m.key, g.key));
    if (host) {
      for (const w of g.words) {
        if (!host.words.some((x) => normalizeWord(x) === normalizeWord(w))) {
          host.words.push(w);
        }
      }
    } else {
      merged.push({ ...g, words: [...g.words] });
    }
  }

  return merged.filter((g) => g.words.length >= 2);
}

export function hasInternalRhymes(
  text: string,
  overrides: RhymeOverrides = {},
): boolean {
  return findInternalRhymes(text, overrides).length > 0;
}
