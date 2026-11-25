import type { VerswerkStore } from "./types";

function mergeByUpdatedAt<T extends { id: string; updatedAt: number }>(
  a: T[],
  b: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) {
    const prev = map.get(item.id);
    if (!prev || item.updatedAt >= prev.updatedAt) map.set(item.id, item);
  }
  return [...map.values()];
}

function mergeByIdPreferLocal<T extends { id: string }>(
  remote: T[],
  local: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) map.set(item.id, item);
  return [...map.values()];
}

/**
 * Best-effort merge after a revision conflict.
 * Songs/Lines: newer updatedAt wins. Sections/MIDI/Overrides: local wins on clash.
 */
export function mergeStores(
  local: VerswerkStore,
  remote: VerswerkStore,
): VerswerkStore {
  const songs = mergeByUpdatedAt(remote.songs, local.songs);
  const lines = mergeByUpdatedAt(remote.lines, local.lines);

  const activeSongId =
    local.activeSongId && songs.some((s) => s.id === local.activeSongId)
      ? local.activeSongId
      : (remote.activeSongId ?? songs[0]?.id ?? null);

  return {
    version: 1,
    songs,
    lines,
    sections: mergeByIdPreferLocal(remote.sections, local.sections),
    midiPatterns: mergeByIdPreferLocal(
      remote.midiPatterns,
      local.midiPatterns,
    ),
    activeSongId,
    pinnedLineIds: [
      ...new Set([
        ...(remote.pinnedLineIds ?? []),
        ...(local.pinnedLineIds ?? []),
      ]),
    ],
    rhymeOverrides: {
      ...(remote.rhymeOverrides ?? {}),
      ...(local.rhymeOverrides ?? {}),
    },
  };
}
