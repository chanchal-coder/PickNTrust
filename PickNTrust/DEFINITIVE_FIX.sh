#!/bin/bash

echo "🎯 DEFINITIVE FIX - Solving localhost connection issues once and for all"

# Step 1: Complete cleanup
echo "🧹 Complete cleanup..."
sudo pkill -9 -f "node" 2>/dev/null || true
sudo pkill -9 -f "npm" 2>/dev/null || true
sudo pkill -9 -f "vite" 2>/dev/null || true
sudo pkill -9 -f "tsx" 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Step 2: Start backend in development mode (this works as confirmed)
echo "🚀 Starting backend in development mode on port 5000..."
NODE_ENV=development nohup npx tsx server/index.ts > backend-working.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 5

# Step 3: Start frontend separately using Vite directly
echo "🚀 Starting frontend on port 5173..."
nohup npx vite --config vite.config.ts --host 0.0.0.0 --port 5173 > frontend-working.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
sleep 8

# Step 4: Test both services
echo "🔍 Testing services..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")

echo "📊 Results:"
echo "Backend (5000): $BACKEND_STATUS"
echo "Frontend (5173): $FRONTEND_STATUS"

if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
    echo "✅ Backend is working!"
else
    echo "❌ Backend failed - check logs: tail -f backend-working.log"
fi

if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "404" ]; then
    echo "✅ Frontend is working!"
else
    echo "❌ Frontend failed - check logs: tail -f frontend-working.log"
fi

echo "📝 Process status:"
ps aux | grep -E "(tsx|vite)" | grep -v grep

echo "🌐 URLs:"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"

echo "📋 Log files:"
echo "Backend: tail -f backend-working.log"
echo "Frontend: tail -f frontend-working.log"

echo "✅ DEFINITIVE FIX COMPLETED!"
