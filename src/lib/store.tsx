"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { nanoid } from "nanoid";
import { analyzeLine } from "./lyrics";
import { createSeedStore } from "./seed";
import type {
  Line,
  LineFocus,
  MidiPattern,
  Section,
  SectionKind,
  Song,
  VerswerkStore,
} from "./types";

const STORAGE_KEY = "verswerk-v1";

const EMPTY_STORE: VerswerkStore = {
  version: 1,
  songs: [],
  lines: [],
  sections: [],
  midiPatterns: [],
  activeSongId: null,
  pinnedLineIds: [],
  rhymeOverrides: {},
};

function withReanalyzedLines(
  lines: Line[],
  overrides: Record<string, string>,
): Line[] {
  return lines.map((line) => {
    const { syllables, rhymeKey } = analyzeLine(line.text, overrides);
    return { ...line, syllables, rhymeKey };
  });
}

type StoreApi = {
  ready: boolean;
  store: VerswerkStore;
  activeSong: Song | null;
  songSections: Section[];
  lineFocus: LineFocus;
  setLineFocus: (focus: LineFocus) => void;
  clearLineFocus: () => void;
  togglePinLine: (id: string) => void;
  setRhymeOverride: (word: string, key: string) => void;
  removeRhymeOverride: (word: string) => void;
  createSong: (title: string) => void;
  setActiveSong: (id: string) => void;
  updateSong: (id: string, patch: Partial<Pick<Song, "title" | "artist" | "bpm" | "key">>) => void;
  deleteSong: (id: string) => void;
  createLine: (text: string, tags?: string[]) => Line;
  updateLine: (id: string, text: string) => void;
  deleteLine: (id: string) => void;
  addSection: (kind: SectionKind) => void;
  updateSection: (id: string, patch: Partial<Pick<Section, "title" | "kind" | "midiPatternId">>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (orderedIds: string[]) => void;
  addLineToSection: (sectionId: string, lineId: string, index?: number) => void;
  removeLineFromSection: (sectionId: string, lineId: string) => void;
  reorderSectionLines: (sectionId: string, orderedLineIds: string[]) => void;
  moveLineBetweenSections: (
    fromSectionId: string,
    toSectionId: string,
    lineId: string,
    toIndex: number,
  ) => void;
  updateMidiPattern: (id: string, patch: Partial<MidiPattern>) => void;
  createMidiPattern: (pattern: Omit<MidiPattern, "id">) => MidiPattern;
  duplicateMidiPattern: (id: string) => MidiPattern | null;
  deleteMidiPattern: (id: string) => void;
  resetDemo: () => void;
  /** Replace entire store (backup restore / vault sync). */
  replaceStore: (next: VerswerkStore) => void;
  getStoreSnapshot: () => VerswerkStore;
};

const StoreContext = createContext<StoreApi | null>(null);

function loadStore(): VerswerkStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedStore();
    const parsed = JSON.parse(raw) as VerswerkStore;
    if (parsed?.version !== 1) return createSeedStore();
    const rhymeOverrides = parsed.rhymeOverrides ?? {};
    return {
      ...parsed,
      rhymeOverrides,
      pinnedLineIds: parsed.pinnedLineIds ?? [],
      lines: withReanalyzedLines(parsed.lines ?? [], rhymeOverrides),
    };
  } catch {
    return createSeedStore();
  }
}

function persist(store: VerswerkStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<VerswerkStore>(EMPTY_STORE);
  const [ready, setReady] = useState(false);
  const [lineFocus, setLineFocusState] = useState<LineFocus>(null);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persist(store);
  }, [store, ready]);

  const mutate = useCallback((fn: (prev: VerswerkStore) => VerswerkStore) => {
    setStore((prev) => fn(prev));
  }, []);

  const activeSong = useMemo(
    () => store.songs.find((s) => s.id === store.activeSongId) ?? null,
    [store.songs, store.activeSongId],
  );

  const songSections = useMemo(() => {
    if (!activeSong) return [];
    return activeSong.sectionIds
      .map((id) => store.sections.find((s) => s.id === id))
      .filter((s): s is Section => Boolean(s));
  }, [activeSong, store.sections]);

  const api: StoreApi = {
    ready,
    store,
    activeSong,
    songSections,
    lineFocus,
    setLineFocus: (focus) => setLineFocusState(focus),
    clearLineFocus: () => setLineFocusState(null),
    togglePinLine: (id) =>
      mutate((prev) => {
        const pinned = prev.pinnedLineIds ?? [];
        return {
          ...prev,
          pinnedLineIds: pinned.includes(id)
            ? pinned.filter((x) => x !== id)
            : [...pinned, id],
        };
      }),
    setRhymeOverride: (word, key) =>
      mutate((prev) => {
        const w = word.trim().toLowerCase().normalize("NFC").replace(/ß/g, "ss").replace(/[^a-zäöü]/g, "");
        const k = key.trim().toLowerCase().replace(/[^a-zäöü0-9]/g, "");
        if (!w || !k) return prev;
        const rhymeOverrides = { ...(prev.rhymeOverrides ?? {}), [w]: k };
        return {
          ...prev,
          rhymeOverrides,
          lines: withReanalyzedLines(prev.lines, rhymeOverrides),
        };
      }),
    removeRhymeOverride: (word) =>
      mutate((prev) => {
        const w = word.trim().toLowerCase().normalize("NFC").replace(/ß/g, "ss").replace(/[^a-zäöü]/g, "");
        const rhymeOverrides = { ...(prev.rhymeOverrides ?? {}) };
        delete rhymeOverrides[w];
        return {
          ...prev,
          rhymeOverrides,
          lines: withReanalyzedLines(prev.lines, rhymeOverrides),
        };
      }),
    createSong: (title) => {
      const now = Date.now();
      const song: Song = {
        id: nanoid(10),
        title: title.trim() || "Neuer Song",
        artist: "",
        bpm: 90,
        key: "Am",
        sectionIds: [],
        createdAt: now,
        updatedAt: now,
      };
      mutate((prev) => ({
        ...prev,
        songs: [song, ...prev.songs],
        activeSongId: song.id,
      }));
    },
    setActiveSong: (id) => mutate((prev) => ({ ...prev, activeSongId: id })),
    updateSong: (id, patch) =>
      mutate((prev) => ({
        ...prev,
        songs: prev.songs.map((s) =>
          s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
        ),
      })),
    deleteSong: (id) =>
      mutate((prev) => {
        const song = prev.songs.find((s) => s.id === id);
        const sectionIds = new Set(song?.sectionIds ?? []);
        const nextSongs = prev.songs.filter((s) => s.id !== id);
        return {
          ...prev,
          songs: nextSongs,
          sections: prev.sections.filter((s) => !sectionIds.has(s.id)),
          activeSongId:
            prev.activeSongId === id
              ? (nextSongs[0]?.id ?? null)
              : prev.activeSongId,
        };
      }),
    createLine: (text, tags = []) => {
      let created: Line | null = null;
      mutate((prev) => {
        const { syllables, rhymeKey } = analyzeLine(
          text,
          prev.rhymeOverrides ?? {},
        );
        const now = Date.now();
        const line: Line = {
          id: nanoid(10),
          text: text.trim(),
          syllables,
          rhymeKey,
          tags,
          createdAt: now,
          updatedAt: now,
        };
        created = line;
        return { ...prev, lines: [line, ...prev.lines] };
      });
      return created!;
    },
    updateLine: (id, text) => {
      mutate((prev) => {
        const { syllables, rhymeKey } = analyzeLine(
          text,
          prev.rhymeOverrides ?? {},
        );
        return {
          ...prev,
          lines: prev.lines.map((l) =>
            l.id === id
              ? {
                  ...l,
                  text: text.trim(),
                  syllables,
                  rhymeKey,
                  updatedAt: Date.now(),
                }
              : l,
          ),
        };
      });
    },
    deleteLine: (id) =>
      mutate((prev) => ({
        ...prev,
        lines: prev.lines.filter((l) => l.id !== id),
        pinnedLineIds: (prev.pinnedLineIds ?? []).filter((x) => x !== id),
        sections: prev.sections.map((s) => ({
          ...s,
          lineIds: s.lineIds.filter((lid) => lid !== id),
        })),
      })),
    addSection: (kind) => {
      if (!activeSong) return;
      const labels: Record<SectionKind, string> = {
        strophe: "Strophe",
        refrain: "Refrain",
        skit: "Skit",
        bridge: "Bridge",
        intro: "Intro",
        outro: "Outro",
        prehook: "Pre-Hook",
        adlib: "Adlib",
      };
      const count =
        activeSong.sectionIds.filter((sid) => {
          const s = store.sections.find((x) => x.id === sid);
          return s?.kind === kind;
        }).length + 1;
      const section: Section = {
        id: nanoid(10),
        kind,
        title: count > 1 ? `${labels[kind]} ${count}` : labels[kind],
        lineIds: [],
        midiPatternId: null,
      };
      mutate((prev) => ({
        ...prev,
        sections: [...prev.sections, section],
        songs: prev.songs.map((s) =>
          s.id === activeSong.id
            ? {
                ...s,
                sectionIds: [...s.sectionIds, section.id],
                updatedAt: Date.now(),
              }
            : s,
        ),
      }));
    },
    updateSection: (id, patch) =>
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      })),
    deleteSection: (id) =>
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== id),
        songs: prev.songs.map((s) => ({
          ...s,
          sectionIds: s.sectionIds.filter((sid) => sid !== id),
          updatedAt: s.sectionIds.includes(id) ? Date.now() : s.updatedAt,
        })),
      })),
    reorderSections: (orderedIds) => {
      if (!activeSong) return;
      mutate((prev) => ({
        ...prev,
        songs: prev.songs.map((s) =>
          s.id === activeSong.id
            ? { ...s, sectionIds: orderedIds, updatedAt: Date.now() }
            : s,
        ),
      }));
    },
    addLineToSection: (sectionId, lineId, index) =>
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          if (s.lineIds.includes(lineId)) return s;
          const lineIds = [...s.lineIds];
          if (index === undefined || index < 0 || index > lineIds.length) {
            lineIds.push(lineId);
          } else {
            lineIds.splice(index, 0, lineId);
          }
          return { ...s, lineIds };
        }),
      })),
    removeLineFromSection: (sectionId, lineId) =>
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? { ...s, lineIds: s.lineIds.filter((id) => id !== lineId) }
            : s,
        ),
      })),
    reorderSectionLines: (sectionId, orderedLineIds) =>
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, lineIds: orderedLineIds } : s,
        ),
      })),
    moveLineBetweenSections: (fromSectionId, toSectionId, lineId, toIndex) =>
      mutate((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id === fromSectionId && fromSectionId !== toSectionId) {
            return { ...s, lineIds: s.lineIds.filter((id) => id !== lineId) };
          }
          if (s.id === toSectionId) {
            const without = s.lineIds.filter((id) => id !== lineId);
            const lineIds = [...without];
            lineIds.splice(Math.min(toIndex, lineIds.length), 0, lineId);
            return { ...s, lineIds };
          }
          return s;
        }),
      })),
    updateMidiPattern: (id, patch) =>
      mutate((prev) => ({
        ...prev,
        midiPatterns: prev.midiPatterns.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      })),
    createMidiPattern: (pattern) => {
      const created: MidiPattern = { ...pattern, id: nanoid(10) };
      mutate((prev) => ({
        ...prev,
        midiPatterns: [...prev.midiPatterns, created],
      }));
      return created;
    },
    duplicateMidiPattern: (id) => {
      let created: MidiPattern | null = null;
      mutate((prev) => {
        const source = prev.midiPatterns.find((p) => p.id === id);
        if (!source) return prev;
        created = {
          ...structuredClone(source),
          id: nanoid(10),
          name: `${source.name} Kopie`,
        };
        return {
          ...prev,
          midiPatterns: [...prev.midiPatterns, created],
        };
      });
      return created;
    },
    deleteMidiPattern: (id) => {
      mutate((prev) => ({
        ...prev,
        midiPatterns: prev.midiPatterns.filter((p) => p.id !== id),
        sections: prev.sections.map((s) =>
          s.midiPatternId === id ? { ...s, midiPatternId: null } : s,
        ),
      }));
    },
    resetDemo: () => {
      const next = createSeedStore();
      setStore(next);
      persist(next);
    },
    replaceStore: (next) => {
      const rhymeOverrides = next.rhymeOverrides ?? {};
      const normalized: VerswerkStore = {
        ...next,
        version: 1,
        rhymeOverrides,
        pinnedLineIds: next.pinnedLineIds ?? [],
        lines: withReanalyzedLines(next.lines ?? [], rhymeOverrides),
      };
      setStore(normalized);
      persist(normalized);
    },
    getStoreSnapshot: () => store,
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
