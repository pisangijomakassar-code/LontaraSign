#!/bin/bash
set -e

APP_DIR="/opt/lontarasign"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "=== LontaraSign Deploy $(date '+%Y-%m-%d %H:%M:%S') ==="

cd "$APP_DIR"

# Pull latest code
echo "[1/4] git pull..."
git pull origin main

# Rebuild & restart containers (zero-downtime: build first, then up)
echo "[2/4] Building images..."
$COMPOSE build --parallel

echo "[3/4] Starting services..."
$COMPOSE up -d --remove-orphans

echo "[4/4] Cleaning unused images..."
docker image prune -f --filter "until=24h"

echo ""
echo "=== Deploy selesai ==="
$COMPOSE ps
