"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type VaultSession = {
  id: string;
  name: string;
  salt: string;
  revision: number;
  /** In-memory only — never written to disk */
  passphrase: string;
};

type VaultSessionApi = {
  session: VaultSession | null;
  setSession: (s: VaultSession | null) => void;
  updateRevision: (revision: number) => void;
  clearSession: () => void;
};

const Ctx = createContext<VaultSessionApi | null>(null);
const META_KEY = "verswerk-vault-meta";

export function VaultSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<VaultSession | null>(null);

  const setSession = useCallback((s: VaultSession | null) => {
    setSessionState(s);
    if (s) {
      sessionStorage.setItem(
        META_KEY,
        JSON.stringify({
          id: s.id,
          name: s.name,
          salt: s.salt,
          revision: s.revision,
        }),
      );
    }
  }, []);

  const updateRevision = useCallback((revision: number) => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, revision };
      sessionStorage.setItem(
        META_KEY,
        JSON.stringify({
          id: next.id,
          name: next.name,
          salt: next.salt,
          revision: next.revision,
        }),
      );
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
  }, []);

  const api = useMemo(
    () => ({ session, setSession, updateRevision, clearSession }),
    [session, setSession, updateRevision, clearSession],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useVaultSession(): VaultSessionApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVaultSession outside provider");
  return ctx;
}

export function readVaultMeta(): Omit<VaultSession, "passphrase"> | null {
  try {
    const raw = sessionStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Omit<VaultSession, "passphrase">;
  } catch {
    return null;
  }
}
