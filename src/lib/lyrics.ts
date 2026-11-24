/** German-oriented syllable & rhyme helpers for lyric lines. */

const VOWELS = /[aeiouyäöü]/i;

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
 * Diphthongs (ei, ai, au, eu, äu, ie) count as one nucleus.
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
        // Skip diphthong / long vowel second letter
        const pair = word.slice(i, i + 2);
        if (
          [
            "ei",
            "ai",
            "au",
            "eu",
            "äu",
            "ie",
            "ea", // Beat, Team, …
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

    // Silent trailing -e often unstressed but still a syllable in German verse
    // (we already counted it). Minimum 1 for any vowel-bearing word.
    total += Math.max(count, word.length > 0 ? 1 : 0);
  }

  return total;
}

/**
 * Rhyme key from the last stressed-ish ending: from the last vowel
 * cluster through the word end (e.g. "Straßen" → "assen", "Flow" → "ow").
 */
export function extractRhymeKey(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const last = normalizeWord(words[words.length - 1]!);
  if (!last) return "";

  let lastVowel = -1;
  for (let i = last.length - 1; i >= 0; i -= 1) {
    if (VOWELS.test(last[i]!)) {
      lastVowel = i;
      // Include previous letter of diphthong
      if (
        i > 0 &&
        ["ei", "ai", "au", "eu", "äu", "ie"].includes(last.slice(i - 1, i + 1))
      ) {
        lastVowel = i - 1;
      }
      break;
    }
  }

  if (lastVowel < 0) return last.slice(-2);

  const key = last.slice(lastVowel);
  // Prefer at least 2 chars for matching
  if (key.length < 2 && last.length >= 2) return last.slice(-2);
  return key;
}

function softRhymeKey(key: string): string {
  // "Ohr" / "zuvor" → ignore silent h so ohr≈or
  return key.replace(/h/g, "");
}

export function linesRhyme(a: string, b: string): boolean {
  const ka = extractRhymeKey(a);
  const kb = extractRhymeKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const sa = softRhymeKey(ka);
  const sb = softRhymeKey(kb);
  if (sa && sb && sa === sb) return true;
  // Soft match: one ending contains the other (min 2 chars)
  if (ka.length >= 2 && kb.length >= 2) {
    return (
      ka.endsWith(kb) ||
      kb.endsWith(ka) ||
      sa.endsWith(sb) ||
      sb.endsWith(sa)
    );
  }
  return false;
}

export function analyzeLine(text: string): {
  syllables: number;
  rhymeKey: string;
} {
  const trimmed = text.trim();
  return {
    syllables: countSyllables(trimmed),
    rhymeKey: extractRhymeKey(trimmed),
  };
}
