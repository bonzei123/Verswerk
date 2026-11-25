import type { MidiKind, MidiScaleId } from "./types";

const NOTE_NAMES_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const SCALE_LABELS: Record<MidiScaleId, string> = {
  chromatic: "Chromatisch",
  major: "Dur",
  minor: "Moll (natürlich)",
  harmonicMinor: "Moll (harmonisch)",
  dorian: "Dorisch",
  pentatonicMinor: "Pentatonik Moll",
  blues: "Blues",
};

/** Semitone offsets from root within one octave. */
export const SCALE_INTERVALS: Record<MidiScaleId, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

export function midiToName(midi: number): string {
  if (midi <= 0) return "—";
  const name = NOTE_NAMES_SHARP[((midi % 12) + 12) % 12]!;
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function isBlackKey(midi: number): boolean {
  const pc = ((midi % 12) + 12) % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

export function isRootPc(midi: number, rootMidi: number): boolean {
  return ((midi % 12) + 12) % 12 === ((rootMidi % 12) + 12) % 12;
}

export function inScale(
  midi: number,
  rootMidi: number,
  scaleId: MidiScaleId,
): boolean {
  if (scaleId === "chromatic") return true;
  const pc = ((midi - rootMidi) % 12 + 12) % 12;
  return SCALE_INTERVALS[scaleId].includes(pc);
}

/** Pitch rows for the piano roll, high → low. */
export function pianoRollPitches(
  kind: MidiKind,
  octaveOffset = 0,
): number[] {
  let low: number;
  let high: number;
  if (kind === "bass") {
    low = 28 + octaveOffset * 12; // E1…
    high = 55 + octaveOffset * 12; // G3…
  } else {
    low = 48 + octaveOffset * 12; // C3…
    high = 84 + octaveOffset * 12; // C6…
  }
  low = Math.max(12, Math.min(100, low));
  high = Math.max(low + 12, Math.min(108, high));
  const out: number[] = [];
  for (let m = high; m >= low; m--) out.push(m);
  return out;
}

export function defaultRootMidi(kind: MidiKind): number {
  return kind === "bass" ? 36 : 60;
}

export function defaultScaleId(kind: MidiKind): MidiScaleId {
  if (kind === "bass" || kind === "melody") return "minor";
  return "chromatic";
}

export function patternLength(steps: number[][]): 16 | 32 {
  const len = steps[0]?.length ?? 16;
  return len >= 32 ? 32 : 16;
}

/** Resize every channel to `length`, padding with 0 or truncating. */
export function resizeSteps(steps: number[][], length: 16 | 32): number[][] {
  return steps.map((row) => {
    if (row.length === length) return [...row];
    if (row.length > length) return row.slice(0, length);
    return [...row, ...Array(length - row.length).fill(0)];
  });
}

export function emptyChannels(
  kind: MidiKind,
  length: 16 | 32 = 16,
): { notes: string[]; steps: number[][] } {
  if (kind === "drums") {
    return {
      notes: ["Kick", "Snare", "Hat"],
      steps: [
        Array(length).fill(0),
        Array(length).fill(0),
        Array(length).fill(0),
      ],
    };
  }
  if (kind === "fx") {
    return {
      notes: ["Noise"],
      steps: [Array(length).fill(0)],
    };
  }
  if (kind === "bass") {
    return { notes: ["Bass"], steps: [Array(length).fill(0)] };
  }
  return { notes: ["Lead"], steps: [Array(length).fill(0)] };
}

/** Cycle drum/fx velocity: off → medium → hard → off. */
export function cycleVelocity(value: number): number {
  if (!value) return 90;
  if (value < 70) return 110;
  if (value < 100) return 0;
  return 55;
}
