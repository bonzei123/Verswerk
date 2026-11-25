import { linesRhyme, rhymeKeysMatch } from "./lyrics";
import type { Line, LineFocus } from "./types";

export type SortKey = "newest" | "oldest" | "syllables-asc" | "syllables-desc" | "rhyme" | "text";

export function applyLineFocus(lines: Line[], focus: LineFocus): Line[] {
  if (!focus) return lines;

  switch (focus.mode) {
    case "syllables":
      return lines.filter((l) => l.syllables === focus.syllables);
    case "syllables-near":
      return lines.filter(
        (l) => Math.abs(l.syllables - focus.syllables) <= 1,
      );
    case "rhyme":
      return lines.filter(
        (l) =>
          l.id === focus.sourceLineId ||
          rhymeKeysMatch(l.rhymeKey, focus.rhymeKey),
      );
    case "rhyme-near":
      return lines.filter(
        (l) =>
          l.id === focus.sourceLineId ||
          rhymeKeysMatch(l.rhymeKey, focus.rhymeKey) ||
          linesRhyme(focus.rhymeKey, l.text),
      );
    default:
      return lines;
  }
}

export function sortLines(lines: Line[], sort: SortKey): Line[] {
  const copy = [...lines];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.createdAt - b.createdAt);
    case "syllables-asc":
      return copy.sort(
        (a, b) => a.syllables - b.syllables || a.text.localeCompare(b.text, "de"),
      );
    case "syllables-desc":
      return copy.sort(
        (a, b) => b.syllables - a.syllables || a.text.localeCompare(b.text, "de"),
      );
    case "rhyme":
      return copy.sort(
        (a, b) =>
          a.rhymeKey.localeCompare(b.rhymeKey, "de") ||
          a.syllables - b.syllables,
      );
    case "text":
      return copy.sort((a, b) => a.text.localeCompare(b.text, "de"));
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export function focusLabel(focus: LineFocus): string | null {
  if (!focus) return null;
  switch (focus.mode) {
    case "syllables":
      return `Genau ${focus.syllables} Silben`;
    case "syllables-near":
      return `Silben ≈ ${focus.syllables} (±1)`;
    case "rhyme":
      return `Reim –${focus.rhymeKey}`;
    case "rhyme-near":
      return `Ähnliche Reime zu –${focus.rhymeKey}`;
    default:
      return null;
  }
}
