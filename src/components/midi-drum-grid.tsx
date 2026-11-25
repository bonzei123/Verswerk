"use client";

import { midiToName } from "@/lib/midi-theory";
import type { MidiPattern } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  pattern: MidiPattern;
  playhead: number;
  onCell: (channel: number, step: number) => void;
  onErase: (channel: number, step: number) => void;
};

export function MidiDrumGrid({ pattern, playhead, onCell, onErase }: Props) {
  const length = pattern.steps[0]?.length ?? 16;
  const colTemplate = `72px repeat(${length}, minmax(18px, 1fr))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto rounded-xl border border-white/10 bg-[#0f1720] p-3">
      <div
        className="mb-2 grid gap-1 text-[9px] uppercase tracking-wider text-white/45"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <span />
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cn(
              "text-center font-mono",
              playhead === i && "font-bold text-[var(--accent-bright)]",
            )}
          >
            {i + 1}
          </span>
        ))}
      </div>

      {pattern.notes.map((label, channel) => (
        <div
          key={label}
          className="mb-2 grid items-center gap-1"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <span className="truncate text-xs text-white/70">{label}</span>
          {Array.from({ length }, (_, step) => {
            const value = pattern.steps[channel]?.[step] ?? 0;
            const active = value > 0;
            const beat = step % 4 === 0;
            const intensity =
              value >= 100 ? "hard" : value >= 70 ? "mid" : value > 0 ? "soft" : "off";
            return (
              <button
                key={step}
                type="button"
                title={
                  active
                    ? `${label} · Vel ${value} (klicken = Velocity)`
                    : `${label} setzen`
                }
                onClick={() => onCell(channel, step)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onErase(channel, step);
                }}
                className={cn(
                  "aspect-square rounded-sm transition-all",
                  intensity === "hard" &&
                    "bg-[var(--accent-bright)] shadow-[0_0_8px_rgba(45,212,191,0.4)]",
                  intensity === "mid" && "bg-[var(--accent-bright)]/75",
                  intensity === "soft" && "bg-[var(--accent-bright)]/45",
                  intensity === "off" &&
                    (beat ? "bg-white/15 hover:bg-white/25" : "bg-white/8 hover:bg-white/18"),
                  playhead === step && "ring-2 ring-white/80 ring-offset-1 ring-offset-[#0f1720]",
                )}
              />
            );
          })}
        </div>
      ))}

      {pattern.kind === "fx" ? null : (
        <p className="mt-2 text-[11px] text-white/40">
          Klick = Velocity (aus → mittel → hart → weich). Rechtsklick löscht.
          {pattern.kind === "drums" ? "" : ` Noten: ${midiToName(36)}…`}
        </p>
      )}
    </div>
  );
}
