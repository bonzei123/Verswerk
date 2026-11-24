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

Port **6997**. Produktion nutzt das Image aus dem GitHub Container Registry:

```bash
git clone https://github.com/bonzei123/Verswerk.git
cd Verswerk
docker compose up -d
```

Dann `http://<nas-ip>:6997`.

Lokal ohne Registry (baut auf der Maschine):

```bash
docker compose up --build -d verswerk
```

## Auto-Update ohne öffentliches SSH

Das NAS ist nur im Heimnetz/VPN erreichbar — GitHub kann also nicht per SSH reinkommen. Stattdessen:

1. **Push auf `main`** → GitHub Actions baut und pusht `ghcr.io/bonzei123/verswerk:latest`
2. **Watchtower auf dem NAS** (im `docker-compose.yml`) prüft alle 5 Minuten GHCR und startet Verswerk neu, wenn ein neues Image da ist

```bash
docker compose up -d
```

Das startet `verswerk` + `verswerk-watchtower`.

### GHCR-Package öffentlich machen (einmalig)

Nach dem ersten erfolgreichen Build:

1. GitHub → dein Profil → **Packages** → `verswerk`
2. Package settings → **Change visibility** → Public  

Sonst braucht das NAS ein Login (`docker login ghcr.io`) mit einem PAT (`read:packages`).

### Alternative: geplanter Task statt Watchtower

Synology **Aufgabenplanung** alle X Minuten:

```bash
cd /volume1/docker/verswerk && ./scripts/nas-deploy.sh
```

Watchtower-Service dann aus der Compose-Datei weglassen bzw. nicht starten:

```bash
docker compose up -d verswerk
```

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, `@dnd-kit`, Tone.js.
