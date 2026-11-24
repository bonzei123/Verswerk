# Verswerk

Persönliche Songwriting-Werkstatt für Rap und Songtexte.

## Zwei Bereiche

1. **Lines & Reime** (`/lines`) — Zeilen anlegen, nach Text/Silben/Reim sortieren und filtern. Rechtsklick (oder ⋯) auf jeden Block: gleiche/ähnliche Silben, gleicher/ähnlicher Reim, für den Song-Maker merken.
2. **Song-Maker** (`/maker`) — gemerkte und alle Lines aufs Workflow-Brett ziehen, zu Strophe/Refrain/Skit/… zusammensetzen, MIDI-Patterns abspielen.

Daten liegen im Browser (`localStorage`).

## Lokal starten

```bash
npm install
npm run dev
```

Dev-Server: [http://localhost:3847](http://localhost:3847)

## Docker (Synology NAS)

Port **6997**:

```bash
docker compose up --build -d
```

Dann im Browser `http://<nas-ip>:6997` öffnen.

Nur Image bauen:

```bash
docker build -t verswerk .
docker run --rm -p 6997:6997 verswerk
```

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, `@dnd-kit`, Tone.js.
