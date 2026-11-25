"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { LineLibrary } from "@/components/line-library";
import { MidiPatternDock } from "@/components/midi-pattern-dock";
import { SongBar } from "@/components/song-bar";
import { WorkflowBoard } from "@/components/workflow-board";
import { useStore } from "@/lib/store";
import type { Line } from "@/lib/types";

export function SongMaker() {
  const {
    ready,
    store,
    songSections,
    addLineToSection,
    reorderSectionLines,
    reorderSections,
    moveLineBetweenSections,
  } = useStore();

  const [activeLine, setActiveLine] = useState<Line | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const lineMap = useMemo(
    () => new Map(store.lines.map((l) => [l.id, l])),
    [store.lines],
  );

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (!data) return;
    if (data.type === "library-line" || data.type === "section-line") {
      setActiveLine(lineMap.get(data.lineId as string) ?? null);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveLine(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData) return;

    if (activeData.type === "section-order" && overData?.type === "section-order") {
      const oldIndex = songSections.findIndex((s) => s.id === activeData.sectionId);
      const newIndex = songSections.findIndex((s) => s.id === overData.sectionId);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        reorderSections(
          arrayMove(
            songSections.map((s) => s.id),
            oldIndex,
            newIndex,
          ),
        );
      }
      return;
    }

    if (activeData.type === "library-line") {
      const lineId = activeData.lineId as string;
      let sectionId: string | null = null;
      let index: number | undefined;

      if (overData?.type === "section") {
        sectionId = overData.sectionId as string;
      } else if (overData?.type === "section-line") {
        sectionId = overData.sectionId as string;
        const section = songSections.find((s) => s.id === sectionId);
        index = section?.lineIds.indexOf(overData.lineId as string);
      } else if (String(over.id).startsWith("section-drop-")) {
        sectionId = String(over.id).replace("section-drop-", "");
      }

      if (sectionId) addLineToSection(sectionId, lineId, index);
      return;
    }

    if (activeData.type === "section-line") {
      const fromSectionId = activeData.sectionId as string;
      const lineId = activeData.lineId as string;

      let toSectionId = fromSectionId;
      let toIndex = 0;

      if (overData?.type === "section") {
        toSectionId = overData.sectionId as string;
        const section = songSections.find((s) => s.id === toSectionId);
        toIndex = section?.lineIds.length ?? 0;
      } else if (overData?.type === "section-line") {
        toSectionId = overData.sectionId as string;
        const section = songSections.find((s) => s.id === toSectionId);
        toIndex = section?.lineIds.indexOf(overData.lineId as string) ?? 0;
      } else if (String(over.id).startsWith("section-drop-")) {
        toSectionId = String(over.id).replace("section-drop-", "");
        const section = songSections.find((s) => s.id === toSectionId);
        toIndex = section?.lineIds.length ?? 0;
      } else {
        return;
      }

      if (fromSectionId === toSectionId) {
        const section = songSections.find((s) => s.id === fromSectionId);
        if (!section) return;
        const oldIndex = section.lineIds.indexOf(lineId);
        if (oldIndex < 0 || oldIndex === toIndex) return;
        reorderSectionLines(
          fromSectionId,
          arrayMove(section.lineIds, oldIndex, toIndex),
        );
      } else {
        moveLineBetweenSections(fromSectionId, toSectionId, lineId, toIndex);
      }
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--ink-muted)]">
        Verswerk lädt…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SongBar />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)_300px] lg:gap-5 lg:px-6 lg:py-5">
          <div className="min-h-[420px] rounded-2xl border border-[var(--ink-faint)] bg-[var(--panel)]/60 p-3 lg:min-h-0 lg:max-h-[calc(100vh-12rem)]">
            <LineLibrary />
          </div>
          <div className="min-h-[480px] rounded-2xl border border-[var(--ink-faint)] bg-[var(--panel)]/40 p-3 lg:min-h-0 lg:max-h-[calc(100vh-12rem)]">
            <WorkflowBoard />
          </div>
          <div className="min-h-[360px] rounded-2xl border border-[var(--ink-faint)] bg-[var(--panel)]/60 p-3 lg:min-h-0 lg:max-h-[calc(100vh-12rem)]">
            <MidiPatternDock />
          </div>
        </main>
        <DragOverlay>
          {activeLine ? (
            <div className="w-[240px] rounded-lg border border-[var(--accent)] bg-white px-3 py-2 shadow-xl">
              <p className="font-[family-name:var(--font-lyric)] text-sm">
                {activeLine.text}
              </p>
              <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
                {activeLine.syllables} Silben · –{activeLine.rhymeKey}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
