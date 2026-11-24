"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ensureAudio,
  isPlaying,
  onStep,
  playPattern,
  stopPattern,
  toggleStep,
} from "@/lib/midi-player";
import { useStore } from "@/lib/store";
import type { MidiKind, MidiPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<MidiKind, string> = {
  drums: "Drums / Rhythm",
  bass: "Bassline",
  melody: "Melody",
  fx: "FX / Sounds",
};

export function MidiStudio() {
  const { store, updateMidiPattern, songSections } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(-1);

  const selected =
    store.midiPatterns.find((p) => p.id === selectedId) ??
    store.midiPatterns[0] ??
    null;

  useEffect(() => {
    if (selected && !selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    return onStep((step) => setPlayhead(step));
  }, []);

  useEffect(() => {
    return () => {
      void stopPattern();
    };
  }, []);

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

  function onCellClick(channel: number, step: number) {
    if (!selected) return;
    if (playing) {
      void stopPattern().then(() => setPlaying(false));
    }
    const steps = toggleStep(selected.steps, channel, step, selected.kind);
    updateMidiPattern(selected.id, { steps });
  }

  const linkedSections = songSections.filter(
    (s) => s.midiPatternId === selected?.id,
  );

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
          MIDI Studio
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Rhythmen, Basslines und Sounds — 16 Steps, direkt abspielbar.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {store.midiPatterns.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              void stopPattern().then(() => setPlaying(false));
              setSelectedId(p.id);
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              selected?.id === p.id
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--ink-faint)] bg-white text-[var(--ink)] hover:border-[var(--accent)]/50",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!selected ? (
        <p className="text-sm text-[var(--ink-muted)]">Keine Patterns geladen.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--ink-faint)] bg-[var(--panel)] px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">{selected.name}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {KIND_LABELS[selected.kind]} · {selected.bpm} BPM
              </p>
            </div>
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

          <div className="flex items-center gap-2">
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
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="w-8 font-mono text-xs">{selected.bpm}</span>
          </div>

          <StepGrid
            pattern={selected}
            playhead={playing ? playhead : -1}
            onCellClick={onCellClick}
          />

          {linkedSections.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Volume2 className="size-3.5 text-[var(--ink-muted)]" />
              <span className="text-[11px] text-[var(--ink-muted)]">Verknüpft:</span>
              {linkedSections.map((s) => (
                <Badge key={s.id} variant="secondary" className="text-[10px]">
                  {s.title}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
            Klicke Steps an, um Kick/Snare/Hat oder Bassnoten zu setzen. Patterns
            lassen sich in jeder Sektion am Brett zuweisen.
          </p>
        </>
      )}
    </aside>
  );
}

function StepGrid({
  pattern,
  playhead,
  onCellClick,
}: {
  pattern: MidiPattern;
  playhead: number;
  onCellClick: (channel: number, step: number) => void;
}) {
  const stepGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
    gap: "2px",
  } as const;

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--ink-faint)] bg-[#15202B] p-3 text-white">
      <div className="mb-2 grid grid-cols-[56px_1fr] gap-2 text-[10px] uppercase tracking-wider text-white/50">
        <span />
        <div style={stepGrid}>
          {Array.from({ length: 16 }, (_, i) => (
            <span
              key={i}
              className={cn(
                "text-center",
                playhead === i && "font-bold text-[var(--accent-bright)]",
              )}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      {pattern.notes.map((note, channel) => (
        <div key={note} className="mb-1.5 grid grid-cols-[56px_1fr] items-center gap-2">
          <span className="truncate text-[11px] text-white/70">{note}</span>
          <div style={stepGrid}>
            {pattern.steps[channel]?.map((value, step) => {
              const active = value > 0;
              const beat = step % 4 === 0;
              const isHead = playhead === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onCellClick(channel, step)}
                  title={
                    pattern.kind === "drums" || pattern.kind === "fx"
                      ? active
                        ? "An"
                        : "Aus"
                      : value
                        ? `MIDI ${value}`
                        : "Pause"
                  }
                  className={cn(
                    "aspect-square rounded-sm transition-colors",
                    active
                      ? "bg-[var(--accent-bright)] shadow-[0_0_8px_rgba(45,212,191,0.45)]"
                      : beat
                        ? "bg-white/15 hover:bg-white/25"
                        : "bg-white/8 hover:bg-white/18",
                    isHead && "ring-2 ring-white/80 ring-offset-1 ring-offset-[#15202B]",
                  )}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
