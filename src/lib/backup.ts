import type { VerswerkStore } from "./types";

export type BackupFile = {
  format: "verswerk-backup";
  formatVersion: 1;
  exportedAt: number;
  store: VerswerkStore;
};

export function buildBackup(store: VerswerkStore): BackupFile {
  return {
    format: "verswerk-backup",
    formatVersion: 1,
    exportedAt: Date.now(),
    store,
  };
}

export function parseBackup(raw: string): VerswerkStore {
  const parsed = JSON.parse(raw) as BackupFile | VerswerkStore;
  if (
    parsed &&
    typeof parsed === "object" &&
    "format" in parsed &&
    parsed.format === "verswerk-backup" &&
    parsed.store
  ) {
    return parsed.store;
  }
  // Raw store dump
  if (
    parsed &&
    typeof parsed === "object" &&
    "version" in parsed &&
    (parsed as VerswerkStore).version === 1 &&
    Array.isArray((parsed as VerswerkStore).lines)
  ) {
    return parsed as VerswerkStore;
  }
  throw new Error("Unbekanntes Backup-Format");
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
