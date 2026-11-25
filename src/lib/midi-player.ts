"use client";

import type { MidiKind, MidiPattern } from "./types";
import { cycleVelocity, patternLength } from "./midi-theory";

type ToneModule = typeof import("tone");

let tonePromise: Promise<ToneModule> | null = null;
let playing = false;
let sequence: {
  stop: (t?: number) => void;
  dispose: () => void;
  start: (t?: number) => void;
} | null = null;
let activeSynths: { dispose: () => void }[] = [];
let stepListeners = new Set<(step: number) => void>();

type PreviewBank = {
  kick: InstanceType<ToneModule["MembraneSynth"]>;
  snare: InstanceType<ToneModule["NoiseSynth"]>;
  hat: InstanceType<ToneModule["MetalSynth"]>;
  bass: InstanceType<ToneModule["MonoSynth"]>;
  lead: InstanceType<ToneModule["Synth"]>;
  noise: InstanceType<ToneModule["NoiseSynth"]>;
};

let previewSynths: PreviewBank | null = null;

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

async function ensurePreviewSynths(Tone: ToneModule): Promise<PreviewBank> {
  if (previewSynths) return previewSynths;

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
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.35, release: 0.15 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.15,
      baseFrequency: 80,
      octaves: 2.5,
    },
  }).toDestination();
  bass.volume.value = -6;

  const lead = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.25, release: 0.25 },
  }).toDestination();
  lead.volume.value = -10;

  const noise = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.01, decay: 0.35, sustain: 0, release: 0.15 },
  }).toDestination();
  noise.volume.value = -16;

  previewSynths = { kick, snare, hat, bass, lead, noise };
  return previewSynths;
}

/** One-shot preview for piano keys / cell clicks. */
export async function previewHit(
  kind: MidiKind,
  opts: { midi?: number; channel?: number; velocity?: number },
): Promise<void> {
  const Tone = await getTone();
  await ensureAudio();
  const synths = await ensurePreviewSynths(Tone);
  const vel = (opts.velocity ?? 90) / 127;

  if (kind === "drums") {
    const ch = opts.channel ?? 0;
    if (ch === 0) synths.kick.triggerAttackRelease("C1", "8n");
    else if (ch === 1) synths.snare.triggerAttackRelease("16n");
    else synths.hat.triggerAttackRelease("32n", Tone.now(), 0.2 + vel * 0.5);
    return;
  }
  if (kind === "fx") {
    synths.noise.triggerAttackRelease("8n");
    return;
  }
  const midi = opts.midi ?? 60;
  if (midi <= 0) return;
  const note = Tone.Frequency(midi, "midi").toNote();
  if (kind === "bass") synths.bass.triggerAttackRelease(note, "8n");
  else synths.lead.triggerAttackRelease(note, "8n");
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

/** How many consecutive steps share the same pitch starting at `step`. */
function holdLength(row: number[], step: number): number {
  const pitch = row[step] ?? 0;
  if (pitch <= 0) return 0;
  let n = 1;
  while (step + n < row.length && row[step + n] === pitch) n++;
  return n;
}

export async function playPattern(pattern: MidiPattern): Promise<void> {
  const Tone = await getTone();
  await ensureAudio();
  await stopPattern();

  Tone.getTransport().bpm.value = pattern.bpm;
  const len = pattern.length ?? patternLength(pattern.steps);

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
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.25 },
  }).toDestination();
  lead.volume.value = -10;

  const noise = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 },
  }).toDestination();
  noise.volume.value = -16;

  activeSynths = [kick, snare, hat, bass, lead, noise];

  const steps = Array.from({ length: len }, (_, i) => i);

  const seq = new Tone.Sequence(
    (time, step: number) => {
      emitStep(step);

      if (pattern.kind === "drums") {
        const kv = pattern.steps[0]?.[step] ?? 0;
        const sv = pattern.steps[1]?.[step] ?? 0;
        const hv = pattern.steps[2]?.[step] ?? 0;
        if (kv)
          kick.triggerAttackRelease(
            "C1",
            "8n",
            time,
            Math.min(1, kv / 100),
          );
        if (sv) snare.triggerAttackRelease("16n", time, Math.min(1, sv / 100));
        if (hv)
          hat.triggerAttackRelease(
            "32n",
            time,
            0.15 + Math.min(0.7, hv / 140),
          );
      } else if (pattern.kind === "bass" || pattern.kind === "melody") {
        const row = pattern.steps[0] ?? [];
        const note = row[step] ?? 0;
        if (note > 0) {
          const prev = step > 0 ? (row[step - 1] ?? 0) : 0;
          if (prev !== note) {
            const hold = holdLength(row, step);
            const dur = Tone.Time("16n").toSeconds() * hold * 0.95;
            if (pattern.kind === "bass") {
              bass.triggerAttackRelease(
                Tone.Frequency(note, "midi").toFrequency(),
                dur,
                time,
              );
            } else {
              lead.triggerAttackRelease(
                Tone.Frequency(note, "midi").toNote(),
                dur,
                time,
              );
            }
          }
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

export function setStepPitch(
  steps: number[][],
  step: number,
  midi: number,
): number[][] {
  const next = steps.map((row) => [...row]);
  const row = next[0];
  if (!row) return steps;
  row[step] = row[step] === midi ? 0 : midi;
  return next;
}

/** Paint pitch without toggle-off (for brush mode). */
export function paintStepPitch(
  steps: number[][],
  step: number,
  midi: number,
): number[][] {
  const next = steps.map((row) => [...row]);
  const row = next[0];
  if (!row) return steps;
  row[step] = midi;
  return next;
}

export function clearStepPitch(steps: number[][], step: number): number[][] {
  const next = steps.map((row) => [...row]);
  const row = next[0];
  if (!row) return steps;
  row[step] = 0;
  return next;
}

export function setDrumStep(
  steps: number[][],
  channel: number,
  step: number,
): number[][] {
  const next = steps.map((row) => [...row]);
  const row = next[channel];
  if (!row) return steps;
  row[step] = cycleVelocity(row[step] ?? 0);
  return next;
}

export function clearChannelStep(
  steps: number[][],
  channel: number,
  step: number,
): number[][] {
  const next = steps.map((row) => [...row]);
  const row = next[channel];
  if (!row) return steps;
  row[step] = 0;
  return next;
}
