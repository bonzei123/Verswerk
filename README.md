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
docker compose pull
docker compose up -d
```

Lokal ohne Registry (baut auf der Maschine):

```bash
docker compose up --build -d
```

Dann `http://<nas-ip>:6997`.

## Auto-Deploy (Push → NAS)

Bei jedem Push auf `main` baut GitHub Actions das Image und pusht es nach `ghcr.io/bonzei123/verswerk:latest`. Optional startet danach ein SSH-Deploy auf dem Synology neu.

### 1. Einmalig auf dem NAS

```bash
# z.B. /volume1/docker/verswerk
git clone https://github.com/bonzei123/Verswerk.git
cd Verswerk
docker compose pull
docker compose up -d
```

SSH für den Deploy-User aktivieren (Systemsteuerung → Terminal & SNMP → SSH).

### 2. GitHub Secrets & Variable

Repo → **Settings → Secrets and variables → Actions**:

| Name | Typ | Inhalt |
| --- | --- | --- |
| `ENABLE_NAS_DEPLOY` | **Variable** | `true` |
| `SYNOLOGY_HOST` | Secret | NAS-IP oder Hostname (von außen / Tailscale / VPN) |
| `SYNOLOGY_USER` | Secret | SSH-User (z.B. dein Admin-User) |
| `SYNOLOGY_SSH_KEY` | Secret | Privater SSH-Key (vollständig, inkl. `BEGIN`/`END`) |
| `SYNOLOGY_PATH` | Secret | Absoluter Pfad zum Clone, z.B. `/volume1/docker/verswerk` |
| `SYNOLOGY_SSH_PORT` | Secret | Optional, Standard `22` |
| `GHCR_TOKEN` | Secret | Optional: PAT mit `read:packages`, falls das Image privat ist |
| `GHCR_USER` | Secret | Optional, Standard `bonzei123` |

Öffentlicher Key des Deploy-Keys auf dem NAS in `~/.ssh/authorized_keys` des Users legen.

### 3. Ablauf

1. Du pushst nach `main`
2. Action baut das Image (nicht auf dem NAS)
3. Wenn `ENABLE_NAS_DEPLOY=true`: SSH → `docker compose pull` → `up -d`

Manuell auf dem NAS: `./scripts/nas-deploy.sh`

Ohne SSH kannst du nur den Image-Build nutzen und auf dem NAS z.B. [Watchtower](https://containrrr.dev/watchtower/) das Image beobachten lassen.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, `@dnd-kit`, Tone.js.
