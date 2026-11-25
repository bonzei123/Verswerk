import { nanoid } from "nanoid";
import { analyzeLine } from "./lyrics";
import { PRESET_PATTERNS } from "./midi-patterns";
import type { Line, MidiPattern, Section, Song, VerswerkStore } from "./types";

function makeLine(text: string, tags: string[] = []): Line {
  const { syllables, rhymeKey } = analyzeLine(text);
  const now = Date.now();
  return {
    id: nanoid(10),
    text,
    syllables,
    rhymeKey,
    tags,
    createdAt: now,
    updatedAt: now,
  };
}

export function createSeedStore(): VerswerkStore {
  const lines: Line[] = [
    makeLine("Ich schreib die Nacht voll bis der Stift bricht", ["hook"]),
    makeLine("Jede Zeile sitzt, jeder Reim trifft", ["hook"]),
    makeLine("Im Studio nur Licht und Beat", ["mood"]),
    makeLine("Jeder Hook ein kleines Lied", ["mood"]),
    makeLine("Bassline tief wie ein Geheimnis", ["mood"]),
    makeLine("Flow wie Puzzle, Stein für Stein", ["flow"]),
    makeLine("Strophe für Strophe, alles mein", ["flow"]),
    makeLine("Refrain bleibt hängen im Ohr", ["hook"]),
    makeLine("Morgen noch lauter als zuvor", ["hook"]),
    makeLine("Skit: Ja digga, hörst du das?", ["skit"]),
    makeLine("Silben zählen, Reime jagen", ["meta"]),
    makeLine("Achtzehn Takte, keine Frage", ["meta"]),
    makeLine("Von der Demo bis zum Master", ["story"]),
    makeLine("Schneller als der Beat, noch knapper", ["story"]),
  ];

  const midiPatterns: MidiPattern[] = PRESET_PATTERNS.map((p) => ({
    ...p,
    id: nanoid(10),
    steps: p.steps.map((row) => [...row]),
  }));

  const boomBap = midiPatterns.find((p) => p.name === "Boom Bap")!;
  const rootBass = midiPatterns.find((p) => p.name === "Root Fifth Bass")!;

  const intro: Section = {
    id: nanoid(10),
    kind: "intro",
    title: "Intro",
    lineIds: [lines[2]!.id, lines[3]!.id],
    midiPatternId: boomBap.id,
  };

  const strophe1: Section = {
    id: nanoid(10),
    kind: "strophe",
    title: "Strophe 1",
    lineIds: [lines[0]!.id, lines[1]!.id, lines[4]!.id, lines[5]!.id],
    midiPatternId: rootBass.id,
  };

  const refrain: Section = {
    id: nanoid(10),
    kind: "refrain",
    title: "Refrain",
    lineIds: [lines[6]!.id, lines[7]!.id],
    midiPatternId: boomBap.id,
  };

  const skit: Section = {
    id: nanoid(10),
    kind: "skit",
    title: "Skit",
    lineIds: [lines[8]!.id],
    midiPatternId: midiPatterns.find((p) => p.name === "Skit Click")!.id,
  };

  const song: Song = {
    id: nanoid(10),
    title: "Demo Track",
    artist: "Verswerk",
    bpm: 90,
    key: "Am",
    sectionIds: [intro.id, strophe1.id, refrain.id, skit.id],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return {
    version: 1,
    songs: [song],
    lines,
    sections: [intro, strophe1, refrain, skit],
    midiPatterns,
    activeSongId: song.id,
    pinnedLineIds: [lines[0]!.id, lines[6]!.id],
  };
}
