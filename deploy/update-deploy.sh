#!/bin/bash

echo "🚀 Starting deployment update process..."

# Step 1: Pull latest code from GitHub
echo "🔄 Pulling latest code from GitHub..."
git pull origin main

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Clean previous builds and caches
echo "🧹 Cleaning previous build artifacts and caches..."
rm -rf dist/
rm -rf dist/public/
rm -rf node_modules/.vite/
rm -rf .vite/
npm cache clean --force

# Step 4: Build frontend and backend
echo "🏗️ Building frontend and backend..."
npm run build

# Step 5: Ensure frontend build is in correct location
echo "📁 Ensuring frontend build is in correct location..."
if [ -d "dist/public" ]; then
    echo "✅ Frontend build found in dist/public"
else
    echo "❌ Frontend build not found in dist/public"
    echo "Checking for build in client/dist..."
    if [ -d "client/dist" ]; then
        echo "Found frontend build in client/dist, copying to dist/public..."
        mkdir -p dist/public
        cp -r client/dist/* dist/public/
    else
        echo "❌ No frontend build found. Please check the build process."
        exit 1
    fi
fi

# Step 6: Restart backend service with PM2
echo "🔄 Restarting backend service with PM2..."
pm2 restart pickntrust-backend || pm2 start dist/server/index.js --name pickntrust-backend

# Step 7: Restart nginx to clear cache
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

echo "✅ Deployment update completed successfully!"
