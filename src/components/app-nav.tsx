"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, LayoutGrid, Library, Music2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/lines", label: "Lines & Reime", icon: Library },
  { href: "/maker", label: "Song-Maker", icon: LayoutGrid },
  { href: "/midi", label: "MIDI", icon: Music2 },
  { href: "/sync", label: "Sync", icon: Cloud },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { resetDemo } = useStore();

  return (
    <header className="border-b border-[var(--ink-faint)] bg-[var(--panel)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/lines" className="group">
            <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
              Verswerk
            </h1>
            <p className="hidden text-xs text-[var(--ink-muted)] group-hover:text-[var(--accent)] sm:block">
              Lines · Songs · MIDI
            </p>
          </Link>
          <nav className="flex gap-1 rounded-xl border border-[var(--ink-faint)] bg-white/70 p-1">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--ink-muted)] hover:bg-[var(--panel)] hover:text-[var(--ink)]",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-[var(--ink-muted)]"
          onClick={() => {
            if (
              confirm(
                "Demo-Daten zurücksetzen? Deine aktuellen Songs und Lines in diesem Browser werden ersetzt.",
              )
            ) {
              resetDemo();
            }
          }}
          title="Demo zurücksetzen"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Demo</span>
        </Button>
      </div>
    </header>
  );
}
