"use client";

import type { MidiPattern } from "./types";

type ToneModule = typeof import("tone");

let tonePromise: Promise<ToneModule> | null = null;
let playing = false;
let sequence: { stop: (t?: number) => void; dispose: () => void; start: (t?: number) => void } | null =
  null;
let activeSynths: { dispose: () => void }[] = [];
let stepListeners = new Set<(step: number) => void>();

async function getTone(): Promise<ToneModule> {
  if (!tonePromise) tonePromise = import("tone");
  return tonePromise;
}

export async function ensureAudio(): Promise<void> {
  const Tone = await getTone();
  if (Tone.getContext().state !== "running") {
    await Tone.start();
  }
}

export function isPlaying(): boolean {
  return playing;
}

export function onStep(listener: (step: number) => void): () => void {
  stepListeners.add(listener);
  return () => {
    stepListeners.delete(listener);
  };
}

function emitStep(step: number) {
  stepListeners.forEach((fn) => fn(step));
}

export async function stopPattern(): Promise<void> {
  const Tone = await getTone();
  if (sequence) {
    try {
      sequence.stop(0);
      sequence.dispose();
    } catch {
      /* already disposed */
    }
    sequence = null;
  }
  Tone.getTransport().stop();
  Tone.getTransport().cancel(0);
  Tone.getTransport().position = 0;
  activeSynths.forEach((s) => {
    try {
      s.dispose();
    } catch {
      /* ignore */
    }
  });
  activeSynths = [];
  playing = false;
  emitStep(-1);
}

export async function playPattern(pattern: MidiPattern): Promise<void> {
  const Tone = await getTone();
  await ensureAudio();
  await stopPattern();

  Tone.getTransport().bpm.value = pattern.bpm;

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).toDestination();

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
  }).toDestination();
  snare.volume.value = -8;

  const hat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).toDestination();
  hat.volume.value = -18;
  hat.frequency.value = 400;

  const bass = new Tone.MonoSynth({
    oscillator: { type: "square" },
    filter: { Q: 2, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.2,
      baseFrequency: 80,
      octaves: 2.5,
    },
  }).toDestination();
  bass.volume.value = -6;

  const lead = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.2 },
  }).toDestination();
  lead.volume.value = -10;

  const noise = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 },
  }).toDestination();
  noise.volume.value = -16;

  activeSynths = [kick, snare, hat, bass, lead, noise];

  const steps = Array.from({ length: 16 }, (_, i) => i);

  const seq = new Tone.Sequence(
    (time, step: number) => {
      emitStep(step);

      if (pattern.kind === "drums") {
        if (pattern.steps[0]?.[step]) kick.triggerAttackRelease("C1", "8n", time);
        if (pattern.steps[1]?.[step]) snare.triggerAttackRelease("16n", time);
        if (pattern.steps[2]?.[step]) hat.triggerAttackRelease("32n", time, 0.3);
      } else if (pattern.kind === "bass") {
        const note = pattern.steps[0]?.[step] ?? 0;
        if (note > 0) {
          bass.triggerAttackRelease(
            Tone.Frequency(note, "midi").toFrequency(),
            "8n",
            time,
          );
        }
      } else if (pattern.kind === "melody") {
        const note = pattern.steps[0]?.[step] ?? 0;
        if (note > 0) {
          lead.triggerAttackRelease(
            Tone.Frequency(note, "midi").toNote(),
            "8n",
            time,
          );
        }
      } else if (pattern.kind === "fx") {
        if (pattern.steps[0]?.[step]) noise.triggerAttackRelease("8n", time);
      }
    },
    steps,
    "16n",
  );

  seq.loop = true;
  sequence = seq;
  seq.start(0);
  playing = true;
  Tone.getTransport().start();
}

/** Toggle a step value for drum/fx (0/1) or leave bass/melody as-is. */
export function toggleStep(
  steps: number[][],
  channel: number,
  step: number,
  kind: MidiPattern["kind"],
): number[][] {
  const next = steps.map((row) => [...row]);
  const row = next[channel];
  if (!row) return steps;
  if (kind === "drums" || kind === "fx") {
    row[step] = row[step] ? 0 : 1;
  } else {
    const cycle = [0, 36, 38, 41, 43, 48, 55, 60, 63, 67];
    const idx = cycle.indexOf(row[step] ?? 0);
    row[step] = cycle[(idx + 1) % cycle.length]!;
  }
  return next;
}
