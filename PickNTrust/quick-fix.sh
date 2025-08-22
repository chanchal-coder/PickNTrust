#!/bin/bash

echo "🚨 QUICK FIX - Starting server in development mode to bypass ES modules issue..."

# Kill everything
sudo pkill -9 -f "node" 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo "🚀 Starting backend in development mode (port 5000)..."
NODE_ENV=development nohup npm run dev > backend-dev.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 5

echo "🔍 Testing backend..."
if curl -s http://localhost:5000 >/dev/null 2>&1; then
    echo "✅ Backend is running on port 5000"
    echo "🌐 Try: http://localhost:5000"
    echo "📝 Backend logs: tail -f backend-dev.log"
else
    echo "❌ Backend still not responding"
    echo "📝 Check logs: tail -f backend-dev.log"
fi

echo "📊 Running processes:"
ps aux | grep -E "(node|npm)" | grep -v grep | head -3

echo "✅ Quick fix completed!"
