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
  const l1 = makeLine("Ich schreib die Nacht voll bis der Stift bricht", ["hook"]);
  const l2 = makeLine("Jede Zeile sitzt, jeder Reim trifft", ["hook"]);
  const beat = makeLine("Im Studio nur Licht und Beat", ["mood"]);
  const lied = makeLine("Jeder Hook ein kleines Lied", ["mood"]);
  const binnen = makeLine(
    "Ich trinke Bier wie ein Tier am Pier um halb vier",
    ["binnen"],
  );
  const bass = makeLine("Bassline tief wie ein Geheimnis", ["mood"]);
  const flow1 = makeLine("Flow wie Puzzle, Stein für Stein", ["flow"]);
  const flow2 = makeLine("Strophe für Strophe, alles mein", ["flow"]);
  const hook1 = makeLine("Refrain bleibt hängen im Ohr", ["hook"]);
  const hook2 = makeLine("Morgen noch lauter als zuvor", ["hook"]);
  const skitLine = makeLine("Skit: Ja digga, hörst du das?", ["skit"]);
  const meta1 = makeLine("Silben zählen, Reime jagen", ["meta"]);
  const meta2 = makeLine("Achtzehn Takte, keine Frage", ["meta"]);
  const story1 = makeLine("Von der Demo bis zum Master", ["story"]);
  const story2 = makeLine("Schneller als der Beat, noch knapper", ["story"]);

  const lines: Line[] = [
    l1,
    l2,
    beat,
    lied,
    binnen,
    bass,
    flow1,
    flow2,
    hook1,
    hook2,
    skitLine,
    meta1,
    meta2,
    story1,
    story2,
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
    lineIds: [beat.id, lied.id],
    midiPatternId: boomBap.id,
  };

  const strophe1: Section = {
    id: nanoid(10),
    kind: "strophe",
    title: "Strophe 1",
    lineIds: [l1.id, l2.id, flow1.id, flow2.id],
    midiPatternId: rootBass.id,
  };

  const refrain: Section = {
    id: nanoid(10),
    kind: "refrain",
    title: "Refrain",
    lineIds: [hook1.id, hook2.id],
    midiPatternId: boomBap.id,
  };

  const skit: Section = {
    id: nanoid(10),
    kind: "skit",
    title: "Skit",
    lineIds: [skitLine.id, binnen.id],
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
    pinnedLineIds: [l1.id, hook1.id],
    rhymeOverrides: {},
  };
}
