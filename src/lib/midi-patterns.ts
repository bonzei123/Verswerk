import type { MidiPattern } from "./types";

/** Built-in step patterns. Channels vary by kind. */
export const PRESET_PATTERNS: Omit<MidiPattern, "id">[] = [
  {
    name: "Boom Bap",
    kind: "drums",
    bpm: 90,
    length: 16,
    notes: ["Kick", "Snare", "Hat"],
    steps: [
      [100, 0, 0, 0, 0, 0, 90, 0, 100, 0, 0, 0, 0, 0, 90, 0],
      [0, 0, 0, 0, 110, 0, 0, 0, 0, 0, 0, 0, 110, 0, 0, 0],
      [70, 0, 55, 0, 70, 0, 55, 0, 70, 0, 55, 0, 70, 55, 70, 0],
    ],
  },
  {
    name: "Trap Hats",
    kind: "drums",
    bpm: 140,
    length: 16,
    notes: ["Kick", "Snare", "Hat"],
    steps: [
      [110, 0, 0, 0, 0, 0, 90, 0, 0, 0, 100, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 110, 0, 0, 0, 0, 0, 0, 0, 110, 0, 0, 80],
      [60, 55, 70, 55, 60, 55, 70, 55, 60, 55, 70, 55, 60, 70, 80, 55],
    ],
  },
  {
    name: "Skit Click",
    kind: "drums",
    bpm: 80,
    length: 16,
    notes: ["Kick", "Snare", "Hat"],
    steps: [
      [90, 0, 0, 0, 0, 0, 0, 0, 90, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 50, 0, 0, 0, 50, 0, 0, 0, 50, 0, 0, 0, 50, 0],
    ],
  },
  {
    name: "Root Fifth Bass",
    kind: "bass",
    bpm: 90,
    length: 16,
    rootMidi: 36,
    scaleId: "minor",
    notes: ["Bass"],
    steps: [[36, 36, 0, 0, 43, 43, 0, 0, 36, 36, 0, 0, 43, 0, 36, 0]],
  },
  {
    name: "Walking Minor",
    kind: "bass",
    bpm: 95,
    length: 16,
    rootMidi: 36,
    scaleId: "minor",
    notes: ["Bass"],
    steps: [[36, 0, 39, 0, 41, 0, 43, 0, 41, 0, 39, 0, 36, 0, 34, 0]],
  },
  {
    name: "808 Bounce",
    kind: "bass",
    bpm: 140,
    length: 16,
    rootMidi: 36,
    scaleId: "minor",
    notes: ["Bass"],
    steps: [[36, 0, 0, 36, 0, 0, 43, 0, 36, 0, 0, 0, 31, 31, 36, 0]],
  },
  {
    name: "Hook Stabs",
    kind: "melody",
    bpm: 90,
    length: 16,
    rootMidi: 60,
    scaleId: "minor",
    notes: ["Lead"],
    steps: [[60, 60, 0, 63, 63, 0, 67, 0, 63, 63, 0, 60, 0, 0, 55, 55]],
  },
  {
    name: "Minor Climb",
    kind: "melody",
    bpm: 100,
    length: 16,
    rootMidi: 57,
    scaleId: "minor",
    notes: ["Lead"],
    steps: [[57, 0, 60, 0, 62, 0, 64, 0, 65, 65, 0, 64, 0, 62, 0, 60]],
  },
  {
    name: "Vinyl Scratch FX",
    kind: "fx",
    bpm: 90,
    length: 16,
    notes: ["Noise"],
    steps: [[90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0, 0, 0]],
  },
];

export function emptySteps(channels: number, length = 16): number[][] {
  return Array.from({ length: channels }, () => Array(length).fill(0));
}
