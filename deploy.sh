#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "[deploy] pulling..."
git pull
echo "[deploy] npm ci..."
npm ci --omit=dev
echo "[deploy] build..."
npm run build
echo "[deploy] reload pm2..."
pm2 reload pickntrust || pm2 start dist/server/index.js --name pickntrust
echo "[deploy] OK"