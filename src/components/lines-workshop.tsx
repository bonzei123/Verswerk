"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { LineBlock } from "@/components/line-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applyLineFocus,
  focusLabel,
  sortLines,
  type SortKey,
} from "@/lib/line-filters";
import { analyzeLine } from "@/lib/lyrics";
import { useStore } from "@/lib/store";

export function LinesWorkshop() {
  const { ready, store, createLine, lineFocus, clearLineFocus } = useStore();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [syllableFilter, setSyllableFilter] = useState("");
  const [rhymeFilter, setRhymeFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [onlyPinned, setOnlyPinned] = useState(false);

  const preview = analyzeLine(draft);

  const syllableOptions = useMemo(() => {
    const set = new Set(store.lines.map((l) => l.syllables));
    return [...set].sort((a, b) => a - b);
  }, [store.lines]);

  const filtered = useMemo(() => {
    let list = applyLineFocus(store.lines, lineFocus);
    const q = query.trim().toLowerCase();
    const syl = syllableFilter === "" ? null : Number(syllableFilter);
    const rhyme = rhymeFilter.trim().toLowerCase();

    list = list.filter((line) => {
      if (onlyPinned && !(store.pinnedLineIds ?? []).includes(line.id)) {
        return false;
      }
      if (q && !line.text.toLowerCase().includes(q)) return false;
      if (syl !== null && !Number.isNaN(syl) && line.syllables !== syl) return false;
      if (rhyme && !line.rhymeKey.toLowerCase().includes(rhyme)) return false;
      return true;
    });

    return sortLines(list, sort);
  }, [
    store.lines,
    store.pinnedLineIds,
    lineFocus,
    query,
    syllableFilter,
    rhymeFilter,
    sort,
    onlyPinned,
  ]);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--ink-muted)]">
        Verswerk lädt…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Bibliothek
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
          Lines & Reime
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
          Hier sammelst und sortierst du Zeilen. Rechtsklick (oder ⋯) auf einen
          Block öffnet Silben- und Reim-Suchen. Gemerke Lines ziehst du danach im
          Song-Maker in Strophen.
        </p>
      </div>

      <form
        className="rounded-2xl border border-[var(--ink-faint)] bg-[var(--panel)]/70 p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          createLine(draft);
          setDraft("");
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Neue Line tippen…"
          className="bg-white font-[family-name:var(--font-lyric)] text-base"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5 text-[10px] text-[var(--ink-muted)]">
            <span className="rounded bg-white px-1.5 py-0.5 font-mono">
              {preview.syllables || 0} Silben
            </span>
            <span className="rounded bg-white px-1.5 py-0.5 font-mono">
              –{preview.rhymeKey || "…"}
            </span>
          </div>
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            <Plus className="size-3.5" />
            Line anlegen
          </Button>
        </div>
      </form>

      <div className="space-y-3 rounded-2xl border border-[var(--ink-faint)] bg-white/70 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Text suchen…"
            className="h-9 bg-white pl-8"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
              Silben
            </label>
            <select
              value={syllableFilter}
              onChange={(e) => setSyllableFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-white px-2 text-sm"
            >
              <option value="">Alle</option>
              {syllableOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
              Reim endet auf
            </label>
            <Input
              value={rhymeFilter}
              onChange={(e) => setRhymeFilter(e.target.value)}
              placeholder="z.B. ein"
              className="h-9 bg-white font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
              Sortierung
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 w-full rounded-lg border border-input bg-white px-2 text-sm"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="syllables-asc">Silben aufsteigend</option>
              <option value="syllables-desc">Silben absteigend</option>
              <option value="rhyme">Nach Reim</option>
              <option value="text">Alphabetisch</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-white px-3 text-sm">
              <input
                type="checkbox"
                checked={onlyPinned}
                onChange={(e) => setOnlyPinned(e.target.checked)}
              />
              Nur gemerkte
            </label>
          </div>
        </div>

        {lineFocus && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--ink)]">
            <span>Kontextfilter: {focusLabel(lineFocus)}</span>
            <button
              type="button"
              onClick={clearLineFocus}
              className="inline-flex items-center gap-1 text-[var(--accent)] underline-offset-2 hover:underline"
            >
              <X className="size-3.5" /> Aufheben
            </button>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-[var(--ink-muted)]">
          {filtered.length} von {store.lines.length} Lines
        </p>
        <p className="text-xs text-[var(--ink-muted)]">
          Rechtsklick auf einen Block für Silben- & Reim-Suche
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="col-span-full py-16 text-center text-sm text-[var(--ink-muted)]">
            Keine Lines gefunden. Filter lockern oder neue Line anlegen.
          </p>
        ) : (
          filtered.map((line) => <LineBlock key={line.id} line={line} />)
        )}
      </div>
    </div>
  );
}
