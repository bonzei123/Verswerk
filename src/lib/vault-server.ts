import { mkdir, readFile, readdir, rename, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export type VaultMeta = {
  id: string;
  name: string;
  revision: number;
  updatedAt: number;
};

export type VaultRecord = VaultMeta & {
  salt: string;
  iv: string;
  ciphertext: string;
};

/** Statically scoped under cwd/data so Turbopack does not trace the whole repo. */
function dataDir(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "vaults");
}

async function ensureDir(): Promise<string> {
  const dir = dataDir();
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
  return dir;
}

function fileFor(id: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error("Ungültige Vault-ID");
  }
  return path.join(/*turbopackIgnore: true*/ dataDir(), `${id}.json`);
}

export async function listVaults(): Promise<VaultMeta[]> {
  const dir = await ensureDir();
  const files = await readdir(/*turbopackIgnore: true*/ dir);
  const metas: VaultMeta[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await readFile(
        /*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ dir, f),
        "utf8",
      );
      const rec = JSON.parse(raw) as VaultRecord;
      metas.push({
        id: rec.id,
        name: rec.name,
        revision: rec.revision,
        updatedAt: rec.updatedAt,
      });
    } catch {
      /* skip corrupt */
    }
  }
  return metas.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getVault(id: string): Promise<VaultRecord | null> {
  await ensureDir();
  try {
    const raw = await readFile(/*turbopackIgnore: true*/ fileFor(id), "utf8");
    return JSON.parse(raw) as VaultRecord;
  } catch {
    return null;
  }
}

export async function createVault(input: {
  name: string;
  salt: string;
  iv: string;
  ciphertext: string;
}): Promise<VaultRecord> {
  await ensureDir();
  const name = input.name.trim().slice(0, 80);
  if (!name) throw new Error("Name fehlt");
  const rec: VaultRecord = {
    id: nanoid(12),
    name,
    salt: input.salt,
    iv: input.iv,
    ciphertext: input.ciphertext,
    revision: 1,
    updatedAt: Date.now(),
  };
  await writeFile(
    /*turbopackIgnore: true*/ fileFor(rec.id),
    JSON.stringify(rec, null, 2),
    "utf8",
  );
  return rec;
}

export type PutResult =
  | { ok: true; record: VaultRecord }
  | { ok: false; conflict: true; record: VaultRecord };

/**
 * Optimistic concurrency: client sends baseRevision.
 * If it doesn't match, reject with current record (409).
 */
export async function putVault(
  id: string,
  input: {
    baseRevision: number;
    iv: string;
    ciphertext: string;
  },
): Promise<PutResult> {
  const current = await getVault(id);
  if (!current) throw new Error("Vault nicht gefunden");

  if (current.revision !== input.baseRevision) {
    return { ok: false, conflict: true, record: current };
  }

  const next: VaultRecord = {
    ...current,
    iv: input.iv,
    ciphertext: input.ciphertext,
    revision: current.revision + 1,
    updatedAt: Date.now(),
  };

  const target = fileFor(id);
  const tmp = `${target}.${process.pid}.tmp`;
  await writeFile(
    /*turbopackIgnore: true*/ tmp,
    JSON.stringify(next, null, 2),
    "utf8",
  );
  await rename(/*turbopackIgnore: true*/ tmp, /*turbopackIgnore: true*/ target);
  return { ok: true, record: next };
}
