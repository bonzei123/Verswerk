/** German + English-loanword syllable & phonetic rhyme helpers. */

const VOWELS = /[aeiouyäöü]/i;

/**
 * English (and anglicized) words common in DE rap → phonetic rhyme ending.
 * Spelling "beat" looks like -eat/-at, but sounds like /biːt/ ≈ Lied/sieht.
 */
const LOANWORD_RHYME: Record<string, string> = {
  beat: "it",
  beats: "its",
  heat: "it",
  meat: "it",
  seat: "it",
  neat: "it",
  street: "it",
  sweet: "it",
  meet: "it",
  sheet: "it",
  feet: "it",
  elite: "it",
  complete: "it",
  defeat: "it",
  repeat: "it",
  delete: "it",
  team: "im",
  dream: "im",
  cream: "im",
  stream: "im",
  scheme: "im",
  theme: "im",
  real: "il",
  feel: "il",
  deal: "il",
  steal: "il",
  wheel: "il",
  flow: "o",
  show: "o",
  glow: "o",
  know: "o",
  low: "o",
  though: "o",
  snow: "o",
  throw: "o",
  go: "o",
  no: "o",
  vibe: "aib",
  vibes: "aibs",
  night: "ait",
  light: "ait",
  tight: "ait",
  right: "ait",
  fight: "ait",
  might: "ait",
  sight: "ait",
  flight: "ait",
  bright: "ait",
  high: "ai",
  bye: "ai",
  why: "ai",
  cry: "ai",
  try: "ai",
  sky: "ai",
  fly: "ai",
  my: "ai",
  game: "eim",
  fame: "eim",
  name: "eim",
  same: "eim",
  blame: "eim",
  shame: "eim",
  flame: "eim",
  cool: "ul",
  school: "ul",
  rule: "ul",
  fool: "ul",
  tool: "ul",
  pool: "ul",
  true: "u",
  blue: "u",
  you: "u",
  too: "u",
  new: "u",
  crew: "u",
  view: "u",
  move: "uv",
  groove: "uv",
  prove: "uv",
  love: "ov",
  money: "ani",
  honey: "ani",
  funny: "ani",
  homie: "omi",
  story: "ori",
  glory: "ori",
  party: "arti",
  body: "odi",
  city: "iti",
  crazy: "esi",
  baby: "ebi",
  lady: "edi",
  maybe: "ebi",
  style: "ail",
  smile: "ail",
  while: "ail",
  mile: "ail",
  fire: "aia",
  desire: "aia",
  higher: "aia",
  liar: "aia",
  time: "aim",
  rhyme: "aim",
  crime: "aim",
  climb: "aim",
  mind: "aind",
  find: "aind",
  kind: "aind",
  blind: "aind",
  grind: "aind",
  face: "eis",
  place: "eis",
  space: "eis",
  bass: "eis", // oft /beɪs/ in Hooks
  base: "eis",
  case: "eis",
  chase: "eis",
  peace: "is",
  piece: "is",
  release: "is",
  police: "is",
  please: "is",
  free: "i",
  me: "i",
  see: "i",
  key: "i",
  tv: "i",
  easy: "isi",
  something: "atin",
  nothing: "atin",
};

/** Normalize for comparison: lowercase, umlauts kept, punctuation stripped. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFC")
    .replace(/ß/g, "ss")
    .replace(/[^a-zäöü]/g, "");
}

/**
 * Approximate German syllable count by vowel groups.
 * Diphthongs (ei, ai, au, eu, äu, ie, ea) count as one nucleus.
 */
export function countSyllables(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  let total = 0;
  for (const raw of words) {
    const word = normalizeWord(raw);
    if (!word) continue;

    let count = 0;
    let i = 0;
    while (i < word.length) {
      if (VOWELS.test(word[i]!)) {
        count += 1;
        const pair = word.slice(i, i + 2);
        if (
          [
            "ei",
            "ai",
            "au",
            "eu",
            "äu",
            "ie",
            "ea",
            "aa",
            "ee",
            "oo",
            "uu",
          ].includes(pair)
        ) {
          i += 2;
          continue;
        }
        i += 1;
        continue;
      }
      i += 1;
    }

    total += Math.max(count, word.length > 0 ? 1 : 0);
  }

  return total;
}

/** Map German spelling of an ending toward a rough phonetic class. */
export function toPhoneticEnding(raw: string): string {
  let s = raw.toLowerCase().normalize("NFC");

  // Vowel digraphs / umlauts → simpler nuclei
  s = s
    .replace(/ieh/g, "i")
    .replace(/ie/g, "i")
    .replace(/ih/g, "i")
    .replace(/eh/g, "e")
    .replace(/ah/g, "a")
    .replace(/oh/g, "o")
    .replace(/uh/g, "u")
    .replace(/äh/g, "e")
    .replace(/öh/g, "o")
    .replace(/üh/g, "i")
    .replace(/ä/g, "e")
    .replace(/ö/g, "o")
    .replace(/ü/g, "i")
    .replace(/ey|ay/g, "ai")
    .replace(/ei|ai/g, "ai")
    .replace(/eu|äu/g, "oi")
    .replace(/aa/g, "a")
    .replace(/ee/g, "e")
    .replace(/oo/g, "o")
    .replace(/uu/g, "u")
    // English-looking leftovers if no loanword hit
    .replace(/ea/g, "i")
    .replace(/ou/g, "u")
    .replace(/ow/g, "o")
    .replace(/igh/g, "ai");

  // Consonant folding (Auslaut / rhyme-relevant)
  s = s
    .replace(/ck/g, "k")
    .replace(/tz/g, "ts")
    .replace(/dt$/g, "t")
    .replace(/d$/g, "t") // Rad ≈ Rat; Lied ≈ Liet → it
    .replace(/b$/g, "p")
    .replace(/g$/g, "k")
    .replace(/v$/g, "f")
    .replace(/h/g, "");

  return s;
}

function orthographicEnding(word: string): string {
  let lastVowel = -1;
  for (let i = word.length - 1; i >= 0; i -= 1) {
    if (VOWELS.test(word[i]!)) {
      lastVowel = i;
      if (
        i > 0 &&
        ["ei", "ai", "au", "eu", "äu", "ie", "ea", "ey", "ay"].includes(
          word.slice(i - 1, i + 1),
        )
      ) {
        lastVowel = i - 1;
      }
      // igh (night)
      if (i >= 2 && word.slice(i - 2, i + 1) === "igh") {
        lastVowel = i - 2;
      }
      break;
    }
  }

  if (lastVowel < 0) {
    return word.length >= 2 ? word.slice(-2) : word;
  }

  const key = word.slice(lastVowel);
  if (key.length < 2 && word.length >= 2) return word.slice(-2);
  return key;
}

export type RhymeOverrides = Record<string, string>;

/** Last content word of a line, normalized. */
export function lastWordOf(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return normalizeWord(words[words.length - 1]!);
}

/** Built-in / orthographic key without user overrides. */
export function autoRhymeKeyForWord(word: string): string {
  const w = normalizeWord(word);
  if (!w) return "";
  if (LOANWORD_RHYME[w]) return LOANWORD_RHYME[w]!;
  return toPhoneticEnding(orthographicEnding(w));
}

/**
 * Phonetic rhyme key for the last word of a line.
 * "Beat" → it, "Lied" → it, "Flow" → o.
 * User overrides win over the built-in loanword list.
 */
export function extractRhymeKey(
  text: string,
  overrides: RhymeOverrides = {},
): string {
  const last = lastWordOf(text);
  if (!last) return "";

  if (overrides[last]) return toPhoneticEnding(overrides[last]!);
  return autoRhymeKeyForWord(last);
}

export function rhymeKeysMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ka = toPhoneticEnding(a);
  const kb = toPhoneticEnding(b);
  if (ka === kb) return true;
  if (ka.length >= 2 && kb.length >= 2) {
    return ka.endsWith(kb) || kb.endsWith(ka);
  }
  return false;
}

export function linesRhyme(
  a: string,
  b: string,
  overrides: RhymeOverrides = {},
): boolean {
  return rhymeKeysMatch(
    extractRhymeKey(a, overrides),
    extractRhymeKey(b, overrides),
  );
}

export function analyzeLine(
  text: string,
  overrides: RhymeOverrides = {},
): {
  syllables: number;
  rhymeKey: string;
} {
  const trimmed = text.trim();
  return {
    syllables: countSyllables(trimmed),
    rhymeKey: extractRhymeKey(trimmed, overrides),
  };
}
