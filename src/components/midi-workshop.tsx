"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eraser,
  Music2,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MidiDrumGrid } from "@/components/midi-drum-grid";
import { MidiPianoRoll } from "@/components/midi-piano-roll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearChannelStep,
  clearStepPitch,
  ensureAudio,
  isPlaying,
  onStep,
  paintStepPitch,
  playPattern,
  previewHit,
  setDrumStep,
  setStepPitch,
  stopPattern,
} from "@/lib/midi-player";
import {
  SCALE_LABELS,
  defaultRootMidi,
  defaultScaleId,
  emptyChannels,
  midiToName,
  patternLength,
  resizeSteps,
} from "@/lib/midi-theory";
import { useStore } from "@/lib/store";
import type { MidiKind, MidiScaleId } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<MidiKind, string> = {
  drums: "Drums",
  bass: "Bass",
  melody: "Melodie",
  fx: "FX",
};

const KIND_ORDER: MidiKind[] = ["drums", "bass", "melody", "fx"];

const SCALE_IDS = Object.keys(SCALE_LABELS) as MidiScaleId[];

const ROOT_CHOICES = [36, 38, 40, 41, 43, 45, 47, 48, 50, 52, 53, 55, 57, 60];

export function MidiWorkshop() {
  const {
    ready,
    store,
    songSections,
    updateMidiPattern,
    createMidiPattern,
    duplicateMidiPattern,
    deleteMidiPattern,
    activeSong,
  } = useStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(-1);
  const [kindFilter, setKindFilter] = useState<MidiKind | "all">("all");
  const [brushMidi, setBrushMidi] = useState<number | null>(null);
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [onlyScaleRows, setOnlyScaleRows] = useState(true);
  const [eraseMode, setEraseMode] = useState(false);

  const patterns = useMemo(() => {
    const list = [...store.midiPatterns];
    if (kindFilter === "all") return list;
    return list.filter((p) => p.kind === kindFilter);
  }, [store.midiPatterns, kindFilter]);

  const selected =
    store.midiPatterns.find((p) => p.id === selectedId) ??
    patterns[0] ??
    store.midiPatterns[0] ??
    null;

  useEffect(() => {
    if (selected && selectedId !== selected.id) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    return onStep((step) => setPlayhead(step));
  }, []);

  useEffect(() => {
    return () => {
      void stopPattern();
    };
  }, []);

  // Sync brush when pattern/root changes
  useEffect(() => {
    if (!selected) return;
    if (selected.kind !== "bass" && selected.kind !== "melody") {
      setBrushMidi(null);
      return;
    }
    const root = selected.rootMidi ?? defaultRootMidi(selected.kind);
    setBrushMidi((prev) => prev ?? root);
    setOctaveOffset(0);
  }, [selected?.id, selected?.kind, selected?.rootMidi]);

  const linkedSections = songSections.filter(
    (s) => s.midiPatternId === selected?.id,
  );

  const length = selected
    ? (selected.length ?? patternLength(selected.steps))
    : 16;
  const rootMidi =
    selected?.rootMidi ??
    defaultRootMidi(selected?.kind === "bass" ? "bass" : "melody");
  const scaleId =
    selected?.scaleId ??
    defaultScaleId(selected?.kind === "bass" ? "bass" : "melody");

  async function togglePlay() {
    if (!selected) return;
    await ensureAudio();
    if (isPlaying()) {
      await stopPattern();
      setPlaying(false);
      setPlayhead(-1);
      return;
    }
    await playPattern(selected);
    setPlaying(true);
  }

  function stopIfPlaying() {
    if (playing) {
      void stopPattern().then(() => {
        setPlaying(false);
        setPlayhead(-1);
      });
    }
  }

  function selectPattern(id: string) {
    stopIfPlaying();
    setSelectedId(id);
  }

  function createNew(kind: MidiKind) {
    stopIfPlaying();
    const { notes, steps } = emptyChannels(kind, 16);
    const created = createMidiPattern({
      name: `Neu · ${KIND_LABELS[kind]}`,
      kind,
      bpm: activeSong?.bpm ?? 90,
      notes,
      steps,
      length: 16,
      rootMidi: defaultRootMidi(kind),
      scaleId: defaultScaleId(kind),
    });
    setSelectedId(created.id);
    setKindFilter(kind);
  }

  function onDuplicate() {
    if (!selected) return;
    stopIfPlaying();
    const copy = duplicateMidiPattern(selected.id);
    if (copy) setSelectedId(copy.id);
  }

  function onDelete() {
    if (!selected) return;
    if (!confirm(`Pattern „${selected.name}“ löschen?`)) return;
    stopIfPlaying();
    const id = selected.id;
    deleteMidiPattern(id);
    const next = store.midiPatterns.find((p) => p.id !== id);
    setSelectedId(next?.id ?? null);
  }

  function setLength(nextLen: 16 | 32) {
    if (!selected) return;
    stopIfPlaying();
    updateMidiPattern(selected.id, {
      length: nextLen,
      steps: resizeSteps(selected.steps, nextLen),
    });
  }

  function onPianoCell(
    step: number,
    midi: number,
    mode: "toggle" | "paint" | "erase",
  ) {
    if (!selected) return;
    stopIfPlaying();
    if (eraseMode || mode === "erase") {
      updateMidiPattern(selected.id, {
        steps: clearStepPitch(selected.steps, step),
      });
      return;
    }
    if (mode === "paint") {
      updateMidiPattern(selected.id, {
        steps: paintStepPitch(selected.steps, step, midi),
      });
      void previewHit(selected.kind, { midi });
      return;
    }
    const next = setStepPitch(selected.steps, step, midi);
    updateMidiPattern(selected.id, { steps: next });
    if ((next[0]?.[step] ?? 0) > 0) {
      void previewHit(selected.kind, { midi });
    }
  }

  function onDrumCell(channel: number, step: number) {
    if (!selected) return;
    stopIfPlaying();
    if (eraseMode) {
      updateMidiPattern(selected.id, {
        steps: clearChannelStep(selected.steps, channel, step),
      });
      return;
    }
    const steps = setDrumStep(selected.steps, channel, step);
    updateMidiPattern(selected.id, { steps });
    const vel = steps[channel]?.[step] ?? 0;
    if (vel > 0) {
      void previewHit(selected.kind, { channel, velocity: vel });
    }
  }

  function clearAllSteps() {
    if (!selected) return;
    if (!confirm("Alle Steps dieses Patterns leeren?")) return;
    stopIfPlaying();
    updateMidiPattern(selected.id, {
      steps: selected.steps.map((row) => row.map(() => 0)),
    });
  }

  function transpose(semitones: number) {
    if (!selected || (selected.kind !== "bass" && selected.kind !== "melody"))
      return;
    stopIfPlaying();
    const steps = selected.steps.map((row) =>
      row.map((v) => {
        if (v <= 0) return 0;
        return Math.max(12, Math.min(108, v + semitones));
      }),
    );
    updateMidiPattern(selected.id, {
      steps,
      rootMidi: Math.max(
        12,
        Math.min(96, (selected.rootMidi ?? rootMidi) + semitones),
      ),
    });
    if (brushMidi != null) {
      setBrushMidi(Math.max(12, Math.min(108, brushMidi + semitones)));
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--ink-muted)]">
        Verswerk lädt…
      </div>
    );
  }

  const isPitchKind =
    selected?.kind === "bass" || selected?.kind === "melody";

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 lg:px-6 lg:py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
            MIDI-Skizzen
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-muted)]">
            Piano-Roll mit Tonhöhe, Skalen-Filter und Pinsel — Drums mit Velocity.
            Patterns kannst du im Song-Maker den Sektionen zuweisen.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KIND_ORDER.map((k) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => createNew(k)}
            >
              <Plus className="size-3.5" />
              {KIND_LABELS[k]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Pattern library */}
        <aside className="flex max-h-[40vh] flex-col gap-2 rounded-2xl border border-[var(--ink-faint)] bg-[var(--panel)]/70 p-3 lg:max-h-[calc(100vh-11rem)]">
          <div className="flex flex-wrap gap-1">
            <FilterChip
              active={kindFilter === "all"}
              onClick={() => setKindFilter("all")}
              label="Alle"
            />
            {KIND_ORDER.map((k) => (
              <FilterChip
                key={k}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
                label={KIND_LABELS[k]}
              />
            ))}
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-auto pr-1">
            {patterns.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-[var(--ink-muted)]">
                Keine Patterns in diesem Filter.
              </p>
            ) : (
              patterns.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPattern(p.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors",
                    selected?.id === p.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-transparent bg-white/60 hover:border-[var(--ink-faint)]",
                  )}
                >
                  <span className="text-sm font-medium text-[var(--ink)]">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    {KIND_LABELS[p.kind]} · {p.bpm} BPM ·{" "}
                    {p.length ?? patternLength(p.steps)} Steps
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Editor */}
        <section className="flex min-h-[520px] flex-col gap-3 rounded-2xl border border-[var(--ink-faint)] bg-[var(--panel)]/50 p-3 lg:min-h-0 lg:max-h-[calc(100vh-11rem)]">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--ink-muted)]">
              <Music2 className="size-8 opacity-40" />
              <p>Lege ein Pattern an oder wähle eines links.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={selected.name}
                  onChange={(e) =>
                    updateMidiPattern(selected.id, { name: e.target.value })
                  }
                  className="h-9 max-w-[220px] bg-white"
                />
                <Badge variant="secondary">{KIND_LABELS[selected.kind]}</Badge>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--ink-faint)] bg-white px-2 py-1">
                  <label className="text-[11px] text-[var(--ink-muted)]">BPM</label>
                  <input
                    type="range"
                    min={60}
                    max={180}
                    value={selected.bpm}
                    onChange={(e) =>
                      updateMidiPattern(selected.id, {
                        bpm: Number(e.target.value),
                      })
                    }
                    className="w-24 accent-[var(--accent)] sm:w-32"
                  />
                  <span className="w-8 font-mono text-xs">{selected.bpm}</span>
                </div>
                <div className="flex rounded-lg border border-[var(--ink-faint)] bg-white p-0.5">
                  {([16, 32] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setLength(n)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs",
                        length === n
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={eraseMode ? "default" : "outline"}
                    onClick={() => setEraseMode((v) => !v)}
                    title="Löschmodus"
                  >
                    <Eraser className="size-3.5" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={onDuplicate}>
                    <Copy className="size-3.5" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={onDelete}>
                    <Trash2 className="size-3.5" />
                  </Button>
                  <Button type="button" size="sm" onClick={() => void togglePlay()}>
                    {playing ? (
                      <>
                        <Pause className="size-3.5" /> Stop
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5" /> Play
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isPitchKind && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--ink-faint)] bg-white/70 px-3 py-2">
                  <label className="text-[11px] text-[var(--ink-muted)]">Skala</label>
                  <select
                    value={scaleId}
                    onChange={(e) =>
                      updateMidiPattern(selected.id, {
                        scaleId: e.target.value as MidiScaleId,
                      })
                    }
                    className="h-8 rounded-md border border-input bg-white px-2 text-xs"
                  >
                    {SCALE_IDS.map((id) => (
                      <option key={id} value={id}>
                        {SCALE_LABELS[id]}
                      </option>
                    ))}
                  </select>
                  <label className="text-[11px] text-[var(--ink-muted)]">Grundton</label>
                  <select
                    value={rootMidi}
                    onChange={(e) =>
                      updateMidiPattern(selected.id, {
                        rootMidi: Number(e.target.value),
                      })
                    }
                    className="h-8 rounded-md border border-input bg-white px-2 text-xs"
                  >
                    {ROOT_CHOICES.map((m) => (
                      <option key={m} value={m}>
                        {midiToName(m)}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                    <input
                      type="checkbox"
                      checked={onlyScaleRows}
                      onChange={(e) => setOnlyScaleRows(e.target.checked)}
                      className="accent-[var(--accent)]"
                    />
                    Nur Skalen-Töne
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setOctaveOffset((o) => Math.max(-2, o - 1))}
                      title="Oktave runter"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <span className="w-16 text-center font-mono text-[11px] text-[var(--ink-muted)]">
                      Oct {octaveOffset >= 0 ? `+${octaveOffset}` : octaveOffset}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setOctaveOffset((o) => Math.min(2, o + 1))}
                      title="Oktave hoch"
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => transpose(-1)}
                    >
                      −1
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => transpose(1)}
                    >
                      +1
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => transpose(-12)}
                    >
                      −12
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => transpose(12)}
                    >
                      +12
                    </Button>
                  </div>
                  {brushMidi != null && (
                    <Badge className="bg-[var(--accent)] text-white">
                      Pinsel {midiToName(brushMidi)}
                    </Badge>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-[var(--ink-muted)]"
                    onClick={clearAllSteps}
                  >
                    Leeren
                  </Button>
                </div>
              )}

              {!isPitchKind && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-[var(--ink-muted)]"
                    onClick={clearAllSteps}
                  >
                    Leeren
                  </Button>
                </div>
              )}

              <div className="flex min-h-0 flex-1 flex-col">
                {isPitchKind ? (
                  <MidiPianoRoll
                    kind={selected.kind}
                    steps={selected.steps}
                    length={length}
                    playhead={playing ? playhead : -1}
                    rootMidi={rootMidi}
                    scaleId={scaleId}
                    octaveOffset={octaveOffset}
                    brushMidi={eraseMode ? null : brushMidi}
                    onlyScaleRows={onlyScaleRows}
                    onCell={onPianoCell}
                    onSelectBrush={(midi) => {
                      setEraseMode(false);
                      setBrushMidi(midi);
                    }}
                    onPreview={(midi) => {
                      void previewHit(selected.kind, { midi });
                    }}
                  />
                ) : (
                  <MidiDrumGrid
                    pattern={selected}
                    playhead={playing ? playhead : -1}
                    onCell={onDrumCell}
                    onErase={(ch, step) => {
                      stopIfPlaying();
                      updateMidiPattern(selected.id, {
                        steps: clearChannelStep(selected.steps, ch, step),
                      });
                    }}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-muted)]">
                {isPitchKind ? (
                  <span>
                    Tasten links wählen den Pinsel. Klick in die Roll setzt die
                    Tonhöhe — gleiche Note nochmal = Pause. Rechtsklick löscht.
                    Gleiche Tonhöhe über mehrere Steps hält den Ton.
                  </span>
                ) : (
                  <span>
                    Klick setzt/ändert die Anschlagstärke. Rechtsklick oder
                    Radiergummi löscht.
                  </span>
                )}
                {linkedSections.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    · Verknüpft:
                    {linkedSections.map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-[10px]">
                        {s.title}
                      </Badge>
                    ))}
                  </span>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--ink-faint)] bg-white text-[var(--ink-muted)] hover:border-[var(--accent)]/40",
      )}
    >
      {label}
    </button>
  );
}
