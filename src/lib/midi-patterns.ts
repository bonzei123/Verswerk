import type { MidiPattern } from "./types";

/** Built-in 16-step patterns. Channels vary by kind. */
export const PRESET_PATTERNS: Omit<MidiPattern, "id">[] = [
  {
    name: "Boom Bap",
    kind: "drums",
    bpm: 90,
    notes: ["Kick", "Snare", "Hat"],
    steps: [
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0],
    ],
  },
  {
    name: "Trap Hats",
    kind: "drums",
    bpm: 140,
    notes: ["Kick", "Snare", "Hat"],
    steps: [
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    name: "Skit Click",
    kind: "drums",
    bpm: 80,
    notes: ["Kick", "Snare", "Hat"],
    steps: [
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    ],
  },
  {
    name: "Root Fifth Bass",
    kind: "bass",
    bpm: 90,
    notes: ["Bass"],
    // MIDI note numbers: C2=36, G2=43, etc. 0 = rest
    steps: [
      [36, 0, 0, 0, 43, 0, 0, 0, 36, 0, 0, 0, 43, 0, 36, 0],
    ],
  },
  {
    name: "Walking Minor",
    kind: "bass",
    bpm: 95,
    notes: ["Bass"],
    steps: [[36, 0, 39, 0, 41, 0, 43, 0, 41, 0, 39, 0, 36, 0, 34, 0]],
  },
  {
    name: "808 Bounce",
    kind: "bass",
    bpm: 140,
    notes: ["Bass"],
    steps: [[36, 0, 0, 36, 0, 0, 43, 0, 36, 0, 0, 0, 31, 0, 36, 0]],
  },
  {
    name: "Hook Stabs",
    kind: "melody",
    bpm: 90,
    notes: ["Lead"],
    steps: [[60, 0, 0, 63, 0, 0, 67, 0, 63, 0, 0, 60, 0, 0, 55, 0]],
  },
  {
    name: "Vinyl Scratch FX",
    kind: "fx",
    bpm: 90,
    notes: ["Noise"],
    steps: [[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]],
  },
];

export function emptySteps(channels: number, length = 16): number[][] {
  return Array.from({ length: channels }, () => Array(length).fill(0));
}
