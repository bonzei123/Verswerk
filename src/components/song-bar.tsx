"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SongBar() {
  const {
    store,
    activeSong,
    createSong,
    setActiveSong,
    updateSong,
    deleteSong,
  } = useStore();
  const [draft, setDraft] = useState("");

  return (
    <div className="border-b border-[var(--ink-faint)] bg-[var(--panel)]/50">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Song-Maker
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Sektionen puzzeln, MIDI zuweisen — Lines kommen aus der Bibliothek.
            </p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createSong(draft || "Neuer Song");
              setDraft("");
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Song-Titel…"
              className="h-8 w-40 bg-white sm:w-52"
            />
            <Button type="submit" size="sm" className="h-8">
              <Plus className="size-3.5" />
              Song
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {store.songs.map((song) => (
            <button
              key={song.id}
              type="button"
              onClick={() => setActiveSong(song.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                song.id === store.activeSongId
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-transparent bg-white/70 text-[var(--ink-muted)] hover:border-[var(--ink-faint)]",
              )}
            >
              {song.title}
            </button>
          ))}
        </div>

        {activeSong && (
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                Titel
              </label>
              <Input
                value={activeSong.title}
                onChange={(e) =>
                  updateSong(activeSong.id, { title: e.target.value })
                }
                className="h-8 bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                Artist
              </label>
              <Input
                value={activeSong.artist}
                onChange={(e) =>
                  updateSong(activeSong.id, { artist: e.target.value })
                }
                className="h-8 bg-white"
                placeholder="Dein Name"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                BPM
              </label>
              <Input
                type="number"
                min={40}
                max={220}
                value={activeSong.bpm}
                onChange={(e) =>
                  updateSong(activeSong.id, {
                    bpm: Number(e.target.value) || 90,
                  })
                }
                className="h-8 w-20 bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                Tonart
              </label>
              <Input
                value={activeSong.key}
                onChange={(e) =>
                  updateSong(activeSong.id, { key: e.target.value })
                }
                className="h-8 w-20 bg-white"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 bg-white text-destructive"
              onClick={() => {
                if (confirm(`Song „${activeSong.title}“ löschen?`)) {
                  deleteSong(activeSong.id);
                }
              }}
            >
              Löschen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
