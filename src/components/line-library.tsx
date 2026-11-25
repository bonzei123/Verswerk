"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { LineBlock } from "@/components/line-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applyLineFocus,
  focusLabel,
  sortLines,
} from "@/lib/line-filters";
import { analyzeLine } from "@/lib/lyrics";
import { useStore } from "@/lib/store";

export function LineLibrary() {
  const { store, createLine, lineFocus, clearLineFocus } = useStore();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [showPinnedFirst, setShowPinnedFirst] = useState(true);

  const preview = analyzeLine(draft, store.rhymeOverrides ?? {});

  const filtered = useMemo(() => {
    let list = applyLineFocus(store.lines, lineFocus);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => l.text.toLowerCase().includes(q));
    }
    list = sortLines(list, "newest");
    if (showPinnedFirst) {
      const pinned = new Set(store.pinnedLineIds ?? []);
      list = [...list].sort((a, b) => {
        const ap = pinned.has(a.id) ? 0 : 1;
        const bp = pinned.has(b.id) ? 0 : 1;
        return ap - bp;
      });
    }
    return list;
  }, [store.lines, store.pinnedLineIds, lineFocus, query, showPinnedFirst]);

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
          Lines zum Ziehen
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Rechtsklick für Reim/Silben. Mehr Filter auf{" "}
          <Link href="/lines" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Lines & Reime
          </Link>
          .
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          createLine(draft);
          setDraft("");
        }}
        className="space-y-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Neue Line…"
          className="bg-white font-[family-name:var(--font-lyric)]"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] text-[var(--ink-muted)]">
            {preview.syllables || 0} · –{preview.rhymeKey || "…"}
          </span>
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            <Plus className="size-3.5" />
            Anlegen
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtern…"
            className="h-8 bg-white pl-8 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
          <input
            type="checkbox"
            checked={showPinnedFirst}
            onChange={(e) => setShowPinnedFirst(e.target.checked)}
          />
          Gemerke oben
        </label>
        {lineFocus && (
          <button
            type="button"
            onClick={clearLineFocus}
            className="flex w-full items-center justify-between rounded-lg bg-[var(--accent-soft)] px-2 py-1.5 text-left text-[11px] text-[var(--ink)]"
          >
            <span>{focusLabel(lineFocus)}</span>
            <X className="size-3.5 text-[var(--accent)]" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--ink-muted)]">
            Keine Lines. Lege welche an oder wechsle zu Lines & Reime.
          </p>
        ) : (
          filtered.map((line) => (
            <LineBlock key={line.id} line={line} draggable compact />
          ))
        )}
      </div>
    </aside>
  );
}
