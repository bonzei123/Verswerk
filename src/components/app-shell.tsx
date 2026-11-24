"use client";

import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="studio-shell flex min-h-screen flex-col">
      <AppNav />
      {children}
    </div>
  );
}
