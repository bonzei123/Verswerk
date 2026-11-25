"use client";

import {
  isBlackKey,
  inScale,
  isRootPc,
  midiToName,
  pianoRollPitches,
} from "@/lib/midi-theory";
import type { MidiKind, MidiScaleId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  kind: MidiKind;
  steps: number[][];
  length: number;
  playhead: number;
  rootMidi: number;
  scaleId: MidiScaleId;
  octaveOffset: number;
  brushMidi: number | null;
  onlyScaleRows: boolean;
  onCell: (step: number, midi: number, mode: "toggle" | "paint" | "erase") => void;
  onSelectBrush: (midi: number) => void;
  onPreview: (midi: number) => void;
};

export function MidiPianoRoll({
  kind,
  steps,
  length,
  playhead,
  rootMidi,
  scaleId,
  octaveOffset,
  brushMidi,
  onlyScaleRows,
  onCell,
  onSelectBrush,
  onPreview,
}: Props) {
  const row = steps[0] ?? [];
  let pitches = pianoRollPitches(kind, octaveOffset);
  if (onlyScaleRows && scaleId !== "chromatic") {
    pitches = pitches.filter((m) => inScale(m, rootMidi, scaleId));
  }

  const colTemplate = `56px repeat(${length}, minmax(18px, 1fr))`;

  return (
    <div className="midi-roll flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1720]">
      <div
        className="sticky top-0 z-10 grid gap-px border-b border-white/10 bg-[#15202B] px-1 py-1 text-[9px] text-white/45"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <span className="pl-1">Ton</span>
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cn(
              "text-center font-mono",
              i % 4 === 0 && "text-white/70",
              playhead === i && "font-bold text-[var(--accent-bright)]",
            )}
          >
            {i + 1}
          </span>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-1 py-1">
        {pitches.map((midi) => {
          const black = isBlackKey(midi);
          const scaleTone = inScale(midi, rootMidi, scaleId);
          const root = isRootPc(midi, rootMidi);
          const brush = brushMidi === midi;

          return (
            <div
              key={midi}
              className="mb-px grid gap-px"
              style={{ gridTemplateColumns: colTemplate }}
            >
              <button
                type="button"
                title={`${midiToName(midi)} — Pinsel / Preview`}
                onClick={() => {
                  onSelectBrush(midi);
                  onPreview(midi);
                }}
                className={cn(
                  "flex h-6 items-center justify-between rounded-sm px-1.5 text-left text-[10px] transition-colors",
                  black
                    ? "bg-[#1a2430] text-white/55"
                    : "bg-[#dce3ec] text-[#15202B]",
                  root && "ring-1 ring-[var(--accent-bright)]/70",
                  brush && "outline outline-2 outline-[var(--accent-bright)]",
                  !scaleTone && scaleId !== "chromatic" && "opacity-40",
                )}
              >
                <span className="font-mono">{midiToName(midi)}</span>
                {root ? <span className="text-[8px] opacity-70">1</span> : null}
              </button>

              {Array.from({ length }, (_, step) => {
                const value = row[step] ?? 0;
                const active = value === midi;
                const other = value > 0 && value !== midi;
                const beat = step % 4 === 0;
                const bar = step % 16 === 0;
                const isHead = playhead === step;
                const mutedRow = !scaleTone && scaleId !== "chromatic";

                return (
                  <button
                    key={step}
                    type="button"
                    title={
                      active
                        ? `${midiToName(midi)} · Step ${step + 1} (entfernen)`
                        : `Setze ${midiToName(midi)}`
                    }
                    onClick={(e) => {
                      if (e.altKey || e.metaKey) {
                        onCell(step, midi, "erase");
                        return;
                      }
                      if (brushMidi != null && !e.shiftKey) {
                        onCell(step, brushMidi, "paint");
                        return;
                      }
                      onCell(step, midi, "toggle");
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onCell(step, midi, "erase");
                    }}
                    className={cn(
                      "h-6 rounded-[3px] transition-colors",
                      active
                        ? "bg-[var(--accent-bright)] shadow-[0_0_10px_rgba(45,212,191,0.35)]"
                        : other
                          ? beat
                            ? "bg-white/10"
                            : "bg-white/[0.06]"
                          : bar
                            ? "bg-white/[0.12] hover:bg-white/20"
                            : beat
                              ? "bg-white/[0.08] hover:bg-white/16"
                              : black
                                ? "bg-white/[0.04] hover:bg-white/12"
                                : "bg-white/[0.06] hover:bg-white/14",
                      mutedRow && !active && "opacity-35",
                      isHead && "ring-1 ring-white/80",
                    )}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
