"use client";

import Link from "next/link";
import { ExternalLink, Music2, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ensureAudio,
  isPlaying,
  onStep,
  playPattern,
  stopPattern,
} from "@/lib/midi-player";
import { patternLength } from "@/lib/midi-theory";
import { useStore } from "@/lib/store";
import type { MidiKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<MidiKind, string> = {
  drums: "Drums",
  bass: "Bass",
  melody: "Melodie",
  fx: "FX",
};

/** Compact pattern picker for the Song-Maker — full editing lives on /midi. */
export function MidiPatternDock() {
  const { store, songSections } = useStore();
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

  useEffect(() => onStep((step) => setPlayhead(step)), []);

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

  const linked = songSections.filter((s) => s.midiPatternId === selected?.id);
  const len = selected
    ? (selected.length ?? patternLength(selected.steps))
    : 16;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
            MIDI
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Skizzen vorspielen und Sektionen zuweisen.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" asChild>
          <Link href="/midi">
            <ExternalLink className="size-3.5" />
            Öffnen
          </Link>
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        {store.midiPatterns.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--ink-faint)] p-4 text-center text-xs text-[var(--ink-muted)]">
            <Music2 className="size-5 opacity-40" />
            Noch keine Patterns — im MIDI-Modul anlegen.
          </div>
        ) : (
          store.midiPatterns.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                void stopPattern().then(() => setPlaying(false));
                setSelectedId(p.id);
              }}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition-colors",
                selected?.id === p.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--ink-faint)] bg-white/70 hover:border-[var(--accent)]/40",
              )}
            >
              <p className="text-sm font-medium text-[var(--ink)]">{p.name}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {KIND_LABELS[p.kind]} · {p.bpm} BPM ·{" "}
                {p.length ?? patternLength(p.steps)} Steps
              </p>
            </button>
          ))
        )}
      </div>

      {selected && (
        <div className="rounded-xl border border-[var(--ink-faint)] bg-[var(--panel)] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{selected.name}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Step {playing && playhead >= 0 ? playhead + 1 : "—"} / {len}
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
          {linked.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {linked.map((s) => (
                <Badge key={s.id} variant="secondary" className="text-[10px]">
                  {s.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
