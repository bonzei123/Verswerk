"use client";

/** Client-only vault crypto. Passphrase never leaves the browser. */

const PBKDF2_ITERATIONS = 310_000;
const MAGIC = "verswerk-vault-v1";

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64ToBuf(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i)!;
  return out;
}

export async function createSalt(): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToB64(salt);
}

async function deriveKey(
  passphrase: string,
  saltB64: string,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBuf(saltB64) as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type EncryptedBlob = {
  salt: string;
  iv: string;
  ciphertext: string;
};

export async function encryptVaultPayload(
  passphrase: string,
  saltB64: string,
  payload: unknown,
): Promise<EncryptedBlob> {
  const key = await deriveKey(passphrase, saltB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(
    JSON.stringify({ magic: MAGIC, data: payload }),
  );
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plain,
  );
  return {
    salt: saltB64,
    iv: bufToB64(iv),
    ciphertext: bufToB64(cipher),
  };
}

export async function decryptVaultPayload<T>(
  passphrase: string,
  blob: EncryptedBlob,
): Promise<T> {
  const key = await deriveKey(passphrase, blob.salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBuf(blob.iv) as BufferSource },
    key,
    b64ToBuf(blob.ciphertext) as BufferSource,
  );
  const parsed = JSON.parse(new TextDecoder().decode(plainBuf)) as {
    magic?: string;
    data?: T;
  };
  if (parsed.magic !== MAGIC || parsed.data === undefined) {
    throw new Error("Ungültige Vault-Daten oder falsche Passphrase");
  }
  return parsed.data;
}
