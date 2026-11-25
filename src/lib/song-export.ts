import { SECTION_LABELS, type Line, type Section, type Song } from "./types";

/** Plain-text song sheet for copy/paste into notes, chat, DAW comments, … */
export function formatSongAsText(
  song: Song,
  sections: Section[],
  lines: Line[],
): string {
  const lineMap = new Map(lines.map((l) => [l.id, l]));
  const parts: string[] = [];

  const header = [song.title.trim() || "Ohne Titel"];
  if (song.artist.trim()) header.push(song.artist.trim());
  const meta = [
    song.bpm ? `${song.bpm} BPM` : null,
    song.key.trim() || null,
  ].filter(Boolean);
  if (meta.length) header.push(meta.join(" · "));
  parts.push(header.join(" — "));
  parts.push("");

  for (const section of sections) {
    const kind = SECTION_LABELS[section.kind] ?? section.kind;
    const title =
      section.title.trim() && section.title.trim() !== kind
        ? `${section.title.trim()} (${kind})`
        : section.title.trim() || kind;
    parts.push(`[${title}]`);
    if (section.lineIds.length === 0) {
      parts.push("(leer)");
    } else {
      for (const id of section.lineIds) {
        const line = lineMap.get(id);
        parts.push(line?.text ?? "");
      }
    }
    parts.push("");
  }

  return parts.join("\n").trimEnd() + "\n";
}
