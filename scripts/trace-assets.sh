#!/usr/bin/env bash
# Trace built assets for passive listeners and preventDefault calls on EC2
# Usage: ./scripts/trace-assets.sh [/path/to/assets]

set -euo pipefail

ASSETS_DIR=${1:-$(pwd)/dist/public/assets}

if [ ! -d "$ASSETS_DIR" ]; then
  echo "Assets directory not found: $ASSETS_DIR"
  echo "Pass the path explicitly, e.g.: ./scripts/trace-assets.sh /home/ec2-user/pickntrust/dist/public/assets"
  exit 1
fi

echo "Scanning assets in: $ASSETS_DIR"

echo "\n== addEventListener for wheel/touchmove/scroll =="
grep -nE "addEventListener\(['\"](wheel|touchmove|scroll)" -R "$ASSETS_DIR"/*.js || true

echo "\n== passive: true listeners =="
grep -n "passive: true" -R "$ASSETS_DIR"/*.js || true

echo "\n== preventDefault calls =="
grep -n "preventDefault\(" -R "$ASSETS_DIR"/*.js || true

echo "\nIf a passive listener path calls preventDefault, that triggers the warning."
echo "Share the filename:line here and we will patch/override the specific listener."