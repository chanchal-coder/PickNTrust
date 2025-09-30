#!/usr/bin/env bash
# Cross-platform deployment script for PickNTrust
# Compatible with Linux EC2 and other Unix-like systems

set -e
cd "$(dirname "$0")"

echo "[deploy] 🚀 Starting deployment..."
echo "[deploy] 📂 Working directory: $(pwd)"
echo "[deploy] 🖥️  Platform: $(uname -s)"

echo "[deploy] 📥 Pulling latest changes..."
git pull

echo "[deploy] 🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/ 2>/dev/null || true

echo "[deploy] 📦 Installing dependencies..."
npm ci --omit=dev

echo "[deploy] 🔨 Building application..."
npm run build

# Verify build output
if [ ! -d "dist/public" ] || [ ! -f "dist/server/index.js" ]; then
    echo "[deploy] ❌ Build verification failed"
    echo "[deploy] Expected: dist/public/ and dist/server/index.js"
    ls -la dist/ 2>/dev/null || echo "[deploy] dist/ directory not found"
    exit 1
fi

echo "[deploy] ✅ Build verification passed"

echo "[deploy] 🔄 Managing PM2 process..."
pm2 reload pickntrust || pm2 start dist/server/index.js --name pickntrust

echo "[deploy] 💾 Saving PM2 configuration..."
pm2 save

echo "[deploy] ✅ Deployment completed successfully!"