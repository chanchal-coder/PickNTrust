#!/bin/bash

echo "🔧 Fixing localhost connection issues..."

# Step 1: Kill any existing processes on ports 5000 and 5173
echo "🛑 Stopping all processes on ports 5000 and 5173..."
sudo pkill -f "node.*server/index" || true
sudo pkill -f "vite.*dev" || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Step 2: Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf .vite/

# Step 3: Install dependencies if needed
echo "📦 Ensuring dependencies are installed..."
npm install

# Step 4: Build frontend
echo "🏗️ Building frontend..."
npx vite build

# Step 5: Check if frontend build was successful
if [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build successful!"
    
    # Copy to expected locations
    mkdir -p public
    cp -r dist/public/* public/
    mkdir -p dist/client
    cp -r dist/public/* dist/client/
    
    echo "📁 Frontend files copied to public and dist/client"
else
    echo "❌ Frontend build failed - checking alternative paths..."
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        echo "✅ Found frontend files in dist/"
        mkdir -p public
        cp -r dist/* public/
        mkdir -p dist/client
        cp -r dist/* dist/client/
    else
        echo "❌ No frontend build files found!"
        ls -la dist/ 2>/dev/null || echo "No dist directory"
        exit 1
    fi
fi

# Step 6: Build backend
echo "🏗️ Building backend..."
npm run build

# Step 7: Start backend server
echo "🚀 Starting backend server on port 5000..."
NODE_ENV=production nohup node dist/server/index.js > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid

# Step 8: Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Step 9: Test backend
echo "🔍 Testing backend connection..."
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Backend is responding on port 5000"
else
    echo "❌ Backend failed to start - checking logs..."
    tail -20 backend.log
    echo "Trying to start backend in development mode..."
    NODE_ENV=development nohup npm run dev > dev.log 2>&1 &
    DEV_PID=$!
    echo $DEV_PID > dev.pid
    sleep 5
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo "✅ Backend started in development mode"
    else
        echo "❌ Backend still not responding"
        tail -20 dev.log
    fi
fi

# Step 10: Start frontend dev server
echo "🚀 Starting frontend dev server on port 5173..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid

# Step 11: Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

# Step 12: Test frontend
echo "🔍 Testing frontend connection..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is responding on port 5173"
else
    echo "❌ Frontend failed to start - checking logs..."
    tail -20 frontend.log
fi

# Step 13: Test both servers
echo "🔍 Final connectivity test..."
echo "Backend test:"
curl -I http://localhost:5000 2>/dev/null || echo "Backend not accessible"
echo "Frontend test:"
curl -I http://localhost:5173 2>/dev/null || echo "Frontend not accessible"

# Step 14: Show process status
echo "📊 Process status:"
ps aux | grep -E "(node|vite)" | grep -v grep

echo "✅ Connection fix completed!"
echo "📝 Logs available in: backend.log, dev.log, frontend.log"
echo "🔧 PIDs saved in: backend.pid, dev.pid, frontend.pid"
