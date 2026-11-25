"use client";

import {
  Cloud,
  Download,
  FolderLock,
  Loader2,
  Lock,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildBackup, downloadJson, parseBackup } from "@/lib/backup";
import { mergeStores } from "@/lib/merge-store";
import { useStore } from "@/lib/store";
import type { VerswerkStore } from "@/lib/types";
import {
  createSalt,
  decryptVaultPayload,
  encryptVaultPayload,
} from "@/lib/vault-crypto";
import { readVaultMeta, useVaultSession } from "@/lib/vault-session";

type VaultListItem = {
  id: string;
  name: string;
  revision: number;
  updatedAt: number;
};

export function DataSyncPanel() {
  const { store, replaceStore } = useStore();
  const { session, setSession, updateRevision } = useVaultSession();
  const [vaults, setVaults] = useState<VaultListItem[]>([]);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [unlockId, setUnlockId] = useState("");
  const [unlockPass, setUnlockPass] = useState("");

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/vaults");
      const data = (await res.json()) as {
        vaults?: VaultListItem[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Liste fehlgeschlagen");
      setVaults(data.vaults ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler");
    }
  }, []);

  useEffect(() => {
    void refreshList();
    const meta = readVaultMeta();
    if (meta) {
      setStatus(
        `Zuletzt: Vault „${meta.name}“ (Rev ${meta.revision}) — Passphrase erneut eingeben zum Sync.`,
      );
      setUnlockId(meta.id);
    }
  }, [refreshList]);

  async function createVault() {
    setBusy(true);
    setError("");
    try {
      if (!newName.trim() || newPass.length < 8) {
        throw new Error("Name + Passphrase (mind. 8 Zeichen) nötig");
      }
      const salt = await createSalt();
      const blob = await encryptVaultPayload(newPass, salt, store);
      const res = await fetch("/api/vaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          salt: blob.salt,
          iv: blob.iv,
          ciphertext: blob.ciphertext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Anlegen fehlgeschlagen");
      setSession({
        id: data.vault.id,
        name: data.vault.name,
        salt: data.vault.salt,
        revision: data.vault.revision,
        passphrase: newPass,
      });
      setNewName("");
      setNewPass("");
      setStatus(
        `Vault „${data.vault.name}“ angelegt und entsperrt (Rev ${data.vault.revision}).`,
      );
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function unlockVault() {
    setBusy(true);
    setError("");
    try {
      if (!unlockId || unlockPass.length < 1) {
        throw new Error("Vault und Passphrase wählen");
      }
      const res = await fetch(`/api/vaults/${unlockId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen");
      const remote = data.vault as {
        id: string;
        name: string;
        salt: string;
        iv: string;
        ciphertext: string;
        revision: number;
      };
      const payload = await decryptVaultPayload<VerswerkStore>(unlockPass, {
        salt: remote.salt,
        iv: remote.iv,
        ciphertext: remote.ciphertext,
      });
      replaceStore(payload);
      setSession({
        id: remote.id,
        name: remote.name,
        salt: remote.salt,
        revision: remote.revision,
        passphrase: unlockPass,
      });
      setUnlockPass("");
      setStatus(`Vault „${remote.name}“ geladen (Rev ${remote.revision}).`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.name === "OperationError"
            ? "Falsche Passphrase oder beschädigte Daten"
            : e.message
          : "Fehler",
      );
    } finally {
      setBusy(false);
    }
  }

  async function pushVault(force = false) {
    if (!session) {
      setError("Zuerst entsperren oder anlegen");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let baseRevision = session.revision;
      if (force) {
        const cur = await fetch(`/api/vaults/${session.id}`);
        const curData = await cur.json();
        if (!cur.ok) throw new Error(curData.error || "Revision lesen fehlgeschlagen");
        baseRevision = curData.vault.revision as number;
      }

      const blob = await encryptVaultPayload(
        session.passphrase,
        session.salt,
        store,
      );
      const res = await fetch(`/api/vaults/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseRevision,
          iv: blob.iv,
          ciphertext: blob.ciphertext,
        }),
      });
      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        const remoteStore = await decryptVaultPayload<VerswerkStore>(
          session.passphrase,
          {
            salt: data.vault.salt,
            iv: data.vault.iv,
            ciphertext: data.vault.ciphertext,
          },
        );
        const choice = window.confirm(
          "Konflikt: Auf dem Server liegt eine neuere Version.\n\nOK = zusammenführen (Merge)\nAbbrechen = stoppen (danach „Server laden“ oder „Erzwungen überschreiben“).",
        );
        if (!choice) {
          setStatus(
            `Konflikt bei Rev ${data.vault.revision}. Lokal unverändert.`,
          );
          return;
        }
        const merged = mergeStores(store, remoteStore);
        replaceStore(merged);
        const mergedBlob = await encryptVaultPayload(
          session.passphrase,
          session.salt,
          merged,
        );
        const retry = await fetch(`/api/vaults/${session.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseRevision: data.vault.revision,
            iv: mergedBlob.iv,
            ciphertext: mergedBlob.ciphertext,
          }),
        });
        const retryData = await retry.json();
        if (!retry.ok) {
          throw new Error(retryData.error || "Merge-Push fehlgeschlagen");
        }
        updateRevision(retryData.vault.revision as number);
        setStatus(
          `Zusammengeführt und hochgeladen (Rev ${retryData.vault.revision}).`,
        );
        return;
      }

      if (!res.ok) throw new Error(data.error || "Push fehlgeschlagen");
      updateRevision(data.vault.revision as number);
      setStatus(
        force
          ? `Hochgeladen (Rev ${data.vault.revision}), Server überschrieben.`
          : `Hochgeladen (Rev ${data.vault.revision}).`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function pullVault() {
    if (!session) {
      setError("Zuerst entsperren");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/vaults/${session.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pull fehlgeschlagen");
      const payload = await decryptVaultPayload<VerswerkStore>(
        session.passphrase,
        {
          salt: data.vault.salt,
          iv: data.vault.iv,
          ciphertext: data.vault.ciphertext,
        },
      );
      replaceStore(payload);
      updateRevision(data.vault.revision as number);
      setStatus(`Vom Server geladen (Rev ${data.vault.revision}).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  function exportBackup() {
    const backup = buildBackup(store);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadJson(`verswerk-backup-${stamp}.json`, backup);
    setStatus("Backup-Datei heruntergeladen.");
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = parseBackup(String(reader.result));
        if (
          !confirm(
            "Backup einspielen? Der aktuelle Stand in diesem Browser wird ersetzt.",
          )
        ) {
          return;
        }
        replaceStore(next);
        setStatus("Backup wiederhergestellt.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import fehlgeschlagen");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Daten
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          Sync & Backup
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Lokal speichert der Browser weiter in localStorage. Für mehrere Geräte:
          verschlüsselter Vault auf diesem Server (Passphrase bleibt nur bei dir).
          Parallel: Revisions-Check — bei Konflikt Merge oder abbrechen.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {status && (
        <p className="rounded-lg border border-[var(--ink-faint)] bg-[var(--panel)] px-3 py-2 text-sm">
          {status}
        </p>
      )}

      <section className="space-y-3 rounded-2xl border border-[var(--ink-faint)] bg-white/70 p-4">
        <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg">
          <Download className="size-4 text-[var(--accent)]" />
          Lokales Backup
        </h3>
        <p className="text-xs text-[var(--ink-muted)]">
          Unverschlüsselte JSON-Datei — gut für Archiv oder manuelles Umziehen.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={exportBackup}>
            <Download className="size-3.5" />
            Backup speichern
          </Button>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-white px-3 text-sm">
            <Upload className="size-3.5" />
            Backup laden
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importBackup(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--ink-faint)] bg-white/70 p-4">
        <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg">
          <FolderLock className="size-4 text-[var(--accent)]" />
          Verschlüsselter Vault
        </h3>
        <p className="text-xs text-[var(--ink-muted)]">
          Speicher-Slots ohne Account. Server sieht nur Ciphertext. Passphrase
          mindestens 8 Zeichen — bei Reload neu eingeben.
        </p>

        {session ? (
          <div className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm">
            Entsperrt: <strong>{session.name}</strong> · Rev {session.revision}
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink-muted)]">
            Kein Vault entsperrt
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-[var(--ink-faint)] p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Neu anlegen
            </p>
            <Input
              placeholder="Slot-Name (z.B. Privat)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Passphrase"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void createVault()}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
              Anlegen & entsperren
            </Button>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--ink-faint)] p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Slot öffnen
            </p>
            <select
              className="h-9 w-full rounded-lg border border-input bg-white px-2 text-sm"
              value={unlockId}
              onChange={(e) => setUnlockId(e.target.value)}
            >
              <option value="">Vault wählen…</option>
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (Rev {v.revision})
                </option>
              ))}
            </select>
            <Input
              type="password"
              placeholder="Passphrase"
              value={unlockPass}
              onChange={(e) => setUnlockPass(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void unlockVault()}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
              Entsperren & laden
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={busy || !session}
            onClick={() => void pushVault(false)}
          >
            <Cloud className="size-3.5" />
            Hochladen
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !session}
            onClick={() => void pullVault()}
          >
            Vom Server laden
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !session}
            onClick={() => {
              if (
                confirm(
                  "Server-Stand mit lokalem Stand überschreiben (erzwungen)?",
                )
              ) {
                void pushVault(true);
              }
            }}
          >
            Erzwungen überschreiben
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void refreshList()}
          >
            Liste aktualisieren
          </Button>
        </div>
      </section>
    </div>
  );
}
