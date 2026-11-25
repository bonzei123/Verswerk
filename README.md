# Verswerk

Persönliche Songwriting-Werkstatt für Rap und Songtexte.

## Bereiche

1. **Lines & Reime** (`/lines`) — Zeilen, Reim-Familien, eigenes Reim-Wörterbuch, Binnenreime
2. **Song-Maker** (`/maker`) — Sektionen puzzeln, MIDI-Skizzen, Song als Text kopieren
3. **Sync** (`/sync`) — lokales Backup/Restore + verschlüsselte Vaults für mehrere Geräte

## Datenmodell

| Was | Wo |
| --- | --- |
| Arbeitsstand im Browser | `localStorage` |
| Backup-Datei | JSON-Download (unverschlüsselt) |
| Multi-Device | Verschlüsselter Vault auf dem Server (`/app/data/vaults`) |

Vaults: **kein Account**. Slot wählen + Passphrase. Verschlüsselung (AES-GCM, PBKDF2) nur im Browser — der Server speichert Ciphertext. Parallelität: **Optimistic Locking** mit Revisionsnummer; bei Konflikt Merge oder Abbruch.

## Lokal starten

```bash
npm install
npm run dev
```

Dev-Server: [http://localhost:3847](http://localhost:3847)

## Docker (Synology NAS)

Port **6997**:

```bash
git clone https://github.com/bonzei123/Verswerk.git
cd Verswerk
docker compose up --build -d
```

Volume `verswerk-data` hält die Vaults. App: `http://<nas-ip>:6997`.

Image aus Registry (nach CI-Build):

```bash
docker compose pull
docker compose up -d
```

## Auto-Update (Heimnetz)

Push auf `main` → GitHub baut `ghcr.io/bonzei123/verswerk:latest` → Watchtower auf dem NAS pullt (kein öffentliches SSH nötig). Package ggf. auf Public stellen.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, `@dnd-kit`, Tone.js, Web Crypto.
