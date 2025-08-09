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
rm -rf node_modules/.vite/
rm -rf .vite/
npm cache clean --force

# Step 4: Build backend
echo "🏗️ Building backend..."
npm run build

# Step 5: Create logs directory for PM2
echo "📁 Creating logs directory..."
mkdir -p logs

# Step 6: Start/restart both frontend and backend with PM2 using ecosystem file
echo "🔄 Starting/restarting both frontend and backend with PM2..."
pm2 start ecosystem.config.js

# Step 7: Restart nginx to clear cache
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Step 8: Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment update completed successfully!"
echo "🌐 Frontend running on port 5173"
echo "🔧 Backend running on port 5000"
echo "� Check logs with: pm2 logs"
