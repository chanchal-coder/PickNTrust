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

# Step 4: Build frontend
echo "🏗️ Building frontend..."
./build-frontend.sh

# Step 5: Build backend
echo "🏗️ Building backend..."
npm run build

# Step 6: Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 delete all || true

# Step 7: Start both servers using the simple script
echo "🚀 Starting both frontend and backend servers..."
nohup ./start-dev-server.sh > server-output.log 2>&1 &

# Step 8: Wait for servers to start
echo "⏳ Waiting for servers to start..."
sleep 10

# Step 9: Check if servers are running
echo "🔍 Checking server status..."
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Backend is running on port 5000"
else
    echo "❌ Backend failed to start"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 5173"
else
    echo "❌ Frontend failed to start"
fi

# Step 10: Restart nginx to clear cache
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

echo "✅ Deployment update completed successfully!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5000"
echo "📝 Check logs: tail -f server-output.log"
