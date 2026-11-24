export type SectionKind =
  | "strophe"
  | "refrain"
  | "skit"
  | "bridge"
  | "intro"
  | "outro"
  | "prehook"
  | "adlib";

export type MidiKind = "drums" | "bass" | "melody" | "fx";

export interface Line {
  id: string;
  text: string;
  syllables: number;
  rhymeKey: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Section {
  id: string;
  kind: SectionKind;
  title: string;
  lineIds: string[];
  midiPatternId: string | null;
}

export interface MidiPattern {
  id: string;
  name: string;
  kind: MidiKind;
  bpm: number;
  /** 16 steps × channels. Drums: kick/snare/hat. Bass: note numbers or 0. */
  steps: number[][];
  notes: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  sectionIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type LineFocus =
  | { mode: "syllables"; syllables: number; sourceLineId?: string }
  | { mode: "syllables-near"; syllables: number; sourceLineId?: string }
  | { mode: "rhyme"; rhymeKey: string; sourceLineId?: string }
  | { mode: "rhyme-near"; rhymeKey: string; sourceLineId?: string }
  | null;

export interface VerswerkStore {
  version: 1;
  songs: Song[];
  lines: Line[];
  sections: Section[];
  midiPatterns: MidiPattern[];
  activeSongId: string | null;
  /** Lines flagged via context menu for quick use in the Song-Maker */
  pinnedLineIds: string[];
}

export const SECTION_LABELS: Record<SectionKind, string> = {
  strophe: "Strophe",
  refrain: "Refrain",
  skit: "Skit",
  bridge: "Bridge",
  intro: "Intro",
  outro: "Outro",
  prehook: "Pre-Hook",
  adlib: "Adlib",
};

export const SECTION_COLORS: Record<SectionKind, string> = {
  strophe: "#1F6FEB",
  refrain: "#D97706",
  skit: "#64748B",
  bridge: "#0F766E",
  intro: "#0EA5E9",
  outro: "#475569",
  prehook: "#CA8A04",
  adlib: "#DB2777",
};
