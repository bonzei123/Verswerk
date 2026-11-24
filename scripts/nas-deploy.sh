#!/usr/bin/env sh
# Manuell auf dem NAS (Heimnetz/VPN) ausführen.
set -eu

cd "$(dirname "$0")/.."

if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-bonzei123}" --password-stdin
fi

docker compose pull verswerk
docker compose up -d --remove-orphans
docker image prune -f
echo "Verswerk neu gestartet auf Port 6997."
