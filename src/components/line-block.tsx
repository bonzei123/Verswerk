"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Bookmark,
  BookmarkCheck,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { findInternalRhymes } from "@/lib/binnenreime";
import {
  autoRhymeKeyForWord,
  lastWordOf,
} from "@/lib/lyrics";
import { useStore } from "@/lib/store";
import type { Line } from "@/lib/types";
import { cn } from "@/lib/utils";

type LineBlockProps = {
  line: Line;
  draggable?: boolean;
  className?: string;
  compact?: boolean;
};

export function LineBlock({
  line,
  draggable = false,
  className,
  compact = false,
}: LineBlockProps) {
  const {
    setLineFocus,
    togglePinLine,
    updateLine,
    deleteLine,
    setRhymeOverride,
    removeRhymeOverride,
    store,
  } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(line.text);
  const [rhymeOpen, setRhymeOpen] = useState(false);
  const [rhymeDraft, setRhymeDraft] = useState(line.rhymeKey);
  const pinned = (store.pinnedLineIds ?? []).includes(line.id);
  const lastWord = lastWordOf(line.text);
  const hasOverride = Boolean(lastWord && store.rhymeOverrides?.[lastWord]);
  const autoKey = lastWord ? autoRhymeKeyForWord(lastWord) : "";
  const internal = useMemo(
    () => findInternalRhymes(line.text, store.rhymeOverrides ?? {}),
    [line.text, store.rhymeOverrides],
  );

  const drag = useDraggable({
    id: `library-${line.id}`,
    data: { type: "library-line", lineId: line.id },
    disabled: !draggable || editing,
  });

  const style =
    draggable && drag.transform
      ? { transform: CSS.Translate.toString(drag.transform) }
      : undefined;

  function applySyllables() {
    setLineFocus({
      mode: "syllables",
      syllables: line.syllables,
      sourceLineId: line.id,
    });
  }

  function applySyllablesNear() {
    setLineFocus({
      mode: "syllables-near",
      syllables: line.syllables,
      sourceLineId: line.id,
    });
  }

  function applyRhyme() {
    setLineFocus({
      mode: "rhyme",
      rhymeKey: line.rhymeKey,
      sourceLineId: line.id,
    });
  }

  function applyRhymeNear() {
    setLineFocus({
      mode: "rhyme-near",
      rhymeKey: line.rhymeKey,
      sourceLineId: line.id,
    });
  }

  function openRhymeDialog() {
    setRhymeDraft(line.rhymeKey || autoKey);
    setRhymeOpen(true);
  }

  function saveEdit() {
    if (draft.trim() && draft.trim() !== line.text) {
      updateLine(line.id, draft);
    } else {
      setDraft(line.text);
    }
    setEditing(false);
  }

  function saveRhymeOverride() {
    if (!lastWord || !rhymeDraft.trim()) return;
    setRhymeOverride(lastWord, rhymeDraft.trim());
    setRhymeOpen(false);
  }

  const menuItems = (
    <>
      <ContextMenuItem onSelect={applySyllables}>
        Gleiche Silbenzahl ({line.syllables})
      </ContextMenuItem>
      <ContextMenuItem onSelect={applySyllablesNear}>
        Ähnliche Silben (±1)
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={applyRhyme}>
        Gleicher Reim (–{line.rhymeKey || "?"})
      </ContextMenuItem>
      <ContextMenuItem onSelect={applyRhymeNear}>
        Ähnliche Reime
      </ContextMenuItem>
      <ContextMenuItem onSelect={openRhymeDialog}>
        Reim festlegen…
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => togglePinLine(line.id)}>
        {pinned ? "Vormerkung entfernen" : "Für Song-Maker merken"}
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={() => {
          setDraft(line.text);
          setEditing(true);
        }}
      >
        Bearbeiten
      </ContextMenuItem>
      <ContextMenuItem
        variant="destructive"
        onSelect={() => {
          if (confirm("Line löschen?")) deleteLine(line.id);
        }}
      >
        Löschen
      </ContextMenuItem>
    </>
  );

  const dropdownItems = (
    <>
      <DropdownMenuItem onSelect={applySyllables}>
        Gleiche Silbenzahl ({line.syllables})
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={applySyllablesNear}>
        Ähnliche Silben (±1)
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={applyRhyme}>
        Gleicher Reim (–{line.rhymeKey || "?"})
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={applyRhymeNear}>
        Ähnliche Reime
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={openRhymeDialog}>
        Reim festlegen…
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => togglePinLine(line.id)}>
        {pinned ? (
          <>
            <BookmarkCheck className="size-3.5" /> Vormerkung entfernen
          </>
        ) : (
          <>
            <Bookmark className="size-3.5" /> Für Song-Maker merken
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          setDraft(line.text);
          setEditing(true);
        }}
      >
        <Pencil className="size-3.5" /> Bearbeiten
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        onSelect={() => {
          if (confirm("Line löschen?")) deleteLine(line.id);
        }}
      >
        <Trash2 className="size-3.5" /> Löschen
      </DropdownMenuItem>
    </>
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={draggable ? drag.setNodeRef : undefined}
            style={style}
            className={cn(
              "group flex items-start gap-2 rounded-xl border border-[var(--ink-faint)] bg-white px-2.5 py-2 shadow-sm transition-colors",
              "hover:border-[var(--accent)]/40",
              draggable && drag.isDragging && "z-50 opacity-40",
              pinned && "border-[var(--accent)]/50 bg-[var(--accent-soft)]/40",
              className,
            )}
          >
            {draggable && (
              <button
                type="button"
                className="mt-0.5 cursor-grab touch-none text-[var(--ink-muted)] active:cursor-grabbing"
                aria-label="Ziehen"
                {...drag.listeners}
                {...drag.attributes}
              >
                <GripVertical className="size-4" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              {editing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                  className="space-y-1.5"
                >
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={saveEdit}
                    className="font-[family-name:var(--font-lyric)]"
                  />
                </form>
              ) : (
                <p
                  className={cn(
                    "font-[family-name:var(--font-lyric)] leading-snug text-[var(--ink)]",
                    compact ? "text-sm" : "text-[15px]",
                  )}
                >
                  {line.text}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {line.syllables} Silben
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px]">
                  –{line.rhymeKey || "?"}
                </Badge>
                {internal.map((g) => (
                  <Badge
                    key={g.key}
                    variant="outline"
                    className="max-w-full truncate text-[10px]"
                    title={`Binnenreim –${g.key}: ${g.words.join(", ")}`}
                  >
                    Binnen: {g.words.join(" · ")}
                  </Badge>
                ))}
                {hasOverride && (
                  <Badge variant="outline" className="text-[10px]">
                    Wörterbuch
                  </Badge>
                )}
                {pinned && (
                  <Badge className="bg-[var(--accent)] text-[10px] text-white">
                    Gemerkt
                  </Badge>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mt-0.5 rounded-md p-1 text-[var(--ink-muted)] opacity-70 hover:bg-[var(--panel)] hover:opacity-100"
                  aria-label="Aktionen"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {dropdownItems}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">{menuItems}</ContextMenuContent>
      </ContextMenu>

      <Dialog open={rhymeOpen} onOpenChange={setRhymeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reim festlegen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--ink-muted)]">
            Endwort{" "}
            <span className="font-mono text-[var(--ink)]">
              {lastWord || "—"}
            </span>
            {autoKey ? (
              <>
                {" "}
                · Auto wäre <span className="font-mono">–{autoKey}</span>
              </>
            ) : null}
          </p>
          <Input
            value={rhymeDraft}
            onChange={(e) => setRhymeDraft(e.target.value)}
            placeholder="z.B. it"
            className="font-mono"
            autoFocus
          />
          <DialogFooter className="gap-2 sm:gap-0">
            {hasOverride && lastWord && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  removeRhymeOverride(lastWord);
                  setRhymeOpen(false);
                }}
              >
                Override löschen
              </Button>
            )}
            <Button type="button" onClick={saveRhymeOverride}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
