"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Music2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import {
  SECTION_COLORS,
  SECTION_LABELS,
  type Line,
  type Section,
  type SectionKind,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const KINDS: SectionKind[] = [
  "intro",
  "strophe",
  "prehook",
  "refrain",
  "skit",
  "bridge",
  "adlib",
  "outro",
];

function SortableLineChip({
  line,
  sectionId,
  onRemove,
}: {
  line: Line;
  sectionId: string;
  onRemove: () => void;
}) {
  const { setLineFocus, togglePinLine } = useStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section-line-${sectionId}-${line.id}`,
    data: { type: "section-line", sectionId, lineId: line.id },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
          }}
          className={cn(
            "flex items-start gap-2 rounded-lg border border-[var(--ink-faint)] bg-white px-2 py-2 shadow-sm",
            isDragging && "z-20 opacity-60 ring-2 ring-[var(--accent)]",
          )}
        >
          <button
            type="button"
            className="mt-0.5 cursor-grab touch-none text-[var(--ink-muted)]"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-lyric)] text-sm leading-snug">
              {line.text}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--ink-muted)]">
              {line.syllables} Silben · –{line.rhymeKey}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-[var(--ink-muted)] hover:text-destructive"
            aria-label="Aus Sektion entfernen"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onSelect={() =>
            setLineFocus({
              mode: "syllables",
              syllables: line.syllables,
              sourceLineId: line.id,
            })
          }
        >
          Gleiche Silbenzahl ({line.syllables})
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() =>
            setLineFocus({
              mode: "syllables-near",
              syllables: line.syllables,
              sourceLineId: line.id,
            })
          }
        >
          Ähnliche Silben (±1)
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() =>
            setLineFocus({
              mode: "rhyme",
              rhymeKey: line.rhymeKey,
              sourceLineId: line.id,
            })
          }
        >
          Gleicher Reim (–{line.rhymeKey || "?"})
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() =>
            setLineFocus({
              mode: "rhyme-near",
              rhymeKey: line.rhymeKey,
              sourceLineId: line.id,
            })
          }
        >
          Ähnliche Reime
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => togglePinLine(line.id)}>
          Für Song-Maker merken
        </ContextMenuItem>
        <ContextMenuItem onSelect={onRemove}>
          Aus Sektion entfernen
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function SectionColumn({
  section,
  lines,
}: {
  section: Section;
  lines: Line[];
}) {
  const { updateSection, deleteSection, removeLineFromSection, store } =
    useStore();
  const { setNodeRef, isOver } = useDroppable({
    id: `section-drop-${section.id}`,
    data: { type: "section", sectionId: section.id },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section-${section.id}`,
    data: { type: "section-order", sectionId: section.id },
  });

  const color = SECTION_COLORS[section.kind];
  const syllableTotal = lines.reduce((sum, l) => sum + l.syllables, 0);

  return (
    <article
      ref={setSortRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-2xl border bg-[var(--panel)]/80 shadow-[0_8px_30px_rgba(21,32,43,0.06)]",
        isDragging && "opacity-70",
        isOver && "ring-2 ring-[var(--accent)]",
      )}
    >
      <header
        className="flex items-start gap-2 rounded-t-2xl border-b border-[var(--ink-faint)] px-3 py-2.5"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-[var(--ink-muted)]"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input
            value={section.title}
            onChange={(e) => updateSection(section.id, { title: e.target.value })}
            className="h-7 border-0 bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={section.kind}
              onChange={(e) =>
                updateSection(section.id, {
                  kind: e.target.value as SectionKind,
                })
              }
              className="h-6 rounded-md border border-input bg-white px-1.5 text-[11px]"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {SECTION_LABELS[k]}
                </option>
              ))}
            </select>
            <Badge variant="secondary" className="text-[10px]">
              {lines.length} Lines · {syllableTotal} Silben
            </Badge>
          </div>
          <select
            value={section.midiPatternId ?? ""}
            onChange={(e) =>
              updateSection(section.id, {
                midiPatternId: e.target.value || null,
              })
            }
            className="h-7 w-full rounded-md border border-input bg-white px-1.5 text-[11px]"
          >
            <option value="">Kein MIDI-Pattern</option>
            {store.midiPatterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.kind}, {p.bpm} BPM)
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => deleteSection(section.id)}
          className="mt-1 text-[var(--ink-muted)] hover:text-destructive"
          aria-label="Sektion löschen"
        >
          <Trash2 className="size-3.5" />
        </button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-1.5 p-2 transition-colors",
          isOver && "bg-[var(--accent-soft)]",
        )}
      >
        <SortableContext
          items={lines.map((l) => `section-line-${section.id}-${l.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {lines.length === 0 ? (
            <p className="m-auto px-4 text-center text-xs text-[var(--ink-muted)]">
              Lines hierher ziehen — wie Puzzle-Teile in die Sektion.
            </p>
          ) : (
            <>
              {lines.map((line) => (
                <SortableLineChip
                  key={line.id}
                  line={line}
                  sectionId={section.id}
                  onRemove={() => removeLineFromSection(section.id, line.id)}
                />
              ))}
              {/* Extra drop area under the last chip so drops below cards still land */}
              <div className="min-h-[48px] flex-1 rounded-lg border border-dashed border-transparent" />
            </>
          )}
        </SortableContext>
      </div>
    </article>
  );
}

export function WorkflowBoard() {
  const { activeSong, songSections, store, addSection } = useStore();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(songSections.length);

  const lineMap = useMemo(
    () => new Map(store.lines.map((l) => [l.id, l])),
    [store.lines],
  );

  useEffect(() => {
    if (songSections.length > prevCount.current) {
      const el = scrollerRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
        });
      }
    }
    prevCount.current = songSections.length;
  }, [songSections.length]);

  if (!activeSong) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--ink-muted)]">
        Lege oben einen Song an, um das Brett zu öffnen.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Music2 className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              Workflow-Brett
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
            {activeSong.title}
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Sektionen wie Puzzle zusammenziehen — Strophe, Refrain, Skit und mehr.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((kind) => (
            <Button
              key={kind}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 bg-white text-xs"
              onClick={() => addSection(kind)}
            >
              <Plus className="size-3" />
              {SECTION_LABELS[kind]}
            </Button>
          ))}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="workflow-scroll min-h-0 flex-1 overflow-x-auto overflow-y-auto pb-2"
      >
        <SortableContext
          items={songSections.map((s) => `section-${s.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex h-full min-h-[420px] gap-3 px-1">
            {songSections.length === 0 ? (
              <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-[var(--ink-faint)] bg-[var(--panel)]/50">
                <p className="max-w-sm px-6 text-center text-sm text-[var(--ink-muted)]">
                  Noch keine Sektionen. Lege oben eine Strophe, einen Refrain oder
                  Skit an und ziehe Lines hinein.
                </p>
              </div>
            ) : (
              songSections.map((section) => (
                <SectionColumn
                  key={section.id}
                  section={section}
                  lines={section.lineIds
                    .map((id) => lineMap.get(id))
                    .filter((l): l is Line => Boolean(l))}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
