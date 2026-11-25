"use client";

import { BookMarked, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { autoRhymeKeyForWord, normalizeWord } from "@/lib/lyrics";
import { useStore } from "@/lib/store";

export function RhymeDictionary() {
  const { store, setRhymeOverride, removeRhymeOverride } = useStore();
  const [word, setWord] = useState("");
  const [key, setKey] = useState("");

  const entries = useMemo(
    () =>
      Object.entries(store.rhymeOverrides ?? {}).sort(([a], [b]) =>
        a.localeCompare(b, "de"),
      ),
    [store.rhymeOverrides],
  );

  const autoHint = word.trim()
    ? autoRhymeKeyForWord(normalizeWord(word))
    : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim() || !key.trim()) return;
    setRhymeOverride(word, key);
    setWord("");
    setKey("");
  }

  return (
    <section className="rounded-2xl border border-[var(--ink-faint)] bg-[var(--panel)]/70 p-3 sm:p-4">
      <div className="mb-3 flex items-start gap-2">
        <BookMarked className="mt-0.5 size-4 text-[var(--accent)]" />
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
            Eigenes Reim-Wörterbuch
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Wenn die Auto-Erkennung danebenliegt: Wort → Klangklasse setzen
            (z.B. <span className="font-mono">beat → it</span>). Gilt für alle
            Lines mit diesem Endwort.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
            Wort
          </label>
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="beat"
            className="bg-white font-mono"
          />
          {autoHint && (
            <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
              Auto wäre: –{autoHint}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
            Reimklasse
          </label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="it"
            className="bg-white font-mono"
          />
        </div>
        <Button type="submit" size="sm" className="h-9" disabled={!word.trim() || !key.trim()}>
          <Plus className="size-3.5" />
          Speichern
        </Button>
      </form>

      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--ink-muted)]">
          Noch keine Einträge. Rechtsklick auf eine Line → „Reim festlegen…“ geht
          auch.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--ink-faint)] rounded-xl border border-[var(--ink-faint)] bg-white">
          {entries.map(([w, k]) => (
            <li
              key={w}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="font-mono">
                {w} <span className="text-[var(--ink-muted)]">→</span> –{k}
              </span>
              <button
                type="button"
                onClick={() => removeRhymeOverride(w)}
                className="text-[var(--ink-muted)] hover:text-destructive"
                aria-label={`${w} entfernen`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
