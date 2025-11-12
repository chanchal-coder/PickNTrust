#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting PickNTrust bot as a separate process (Linux)"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is required. Install Node.js first." >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "⚠️  PM2 not found. Installing globally..."
  npm install -g pm2
fi

if [ -f .env ]; then
  echo "📦 Loading .env"
  # export only non-comment lines
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${MASTER_BOT_TOKEN:-}" ]; then
  echo "❌ MASTER_BOT_TOKEN not set. Export it or add to .env" >&2
  exit 1
fi

echo "✅ Environment OK. Starting bot via PM2..."
pm2 start start-bot-fixed.cjs --name pickntrust-bot
pm2 save
pm2 status

echo "✅ Bot started. View logs with: pm2 logs pickntrust-bot"
echo "🛑 Stop with: pm2 stop pickntrust-bot"