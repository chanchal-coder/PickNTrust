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

# Step 5: Start frontend static server (if needed)
# For production, frontend is served as static files by backend/nginx
# Uncomment below if you want to run a separate frontend server
# echo "🚀 Starting frontend static server..."
# nohup serve -s dist/public -l 3000 &

# Step 6: Restart backend service with PM2
echo "🔄 Restarting backend service with PM2..."
pm2 restart pickntrust-backend || pm2 start dist/server/index.js --name pickntrust-backend

# Step 7: Restart nginx to clear cache
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

echo "✅ Deployment update completed successfully!"
