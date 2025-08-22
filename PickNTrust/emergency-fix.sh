#!/bin/bash

echo "🚨 EMERGENCY FIX - Starting servers immediately..."

# Kill everything on these ports
sudo pkill -9 -f "node" 2>/dev/null || true
sudo pkill -9 -f "npm" 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start backend immediately in background
echo "🚀 Starting backend on port 5000..."
NODE_ENV=development nohup npm run dev > /dev/null 2>&1 &
sleep 3

# Test backend
if curl -s http://localhost:5000 >/dev/null 2>&1; then
    echo "✅ Backend running on port 5000"
else
    echo "❌ Backend failed - trying alternative..."
    NODE_ENV=production nohup node server/index.ts > /dev/null 2>&1 &
    sleep 3
fi

# Start frontend in background  
echo "🚀 Starting frontend on port 5173..."
cd client 2>/dev/null || true
nohup npx vite --host 0.0.0.0 --port 5173 > /dev/null 2>&1 &
cd .. 2>/dev/null || true
sleep 3

# Alternative frontend start
if ! curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "❌ Frontend failed - trying alternative..."
    nohup npx vite dev --host 0.0.0.0 --port 5173 > /dev/null 2>&1 &
    sleep 3
fi

echo "🔍 Testing connections..."
echo "Backend (5000): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")"
echo "Frontend (5173): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")"

echo "📊 Running processes:"
ps aux | grep -E "(node|npm|vite)" | grep -v grep | head -5

echo "✅ Emergency fix completed!"
echo "🌐 Try: http://localhost:5000 and http://localhost:5173"
