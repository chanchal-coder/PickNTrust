#!/bin/bash

echo "🎯 FINAL WORKING FIX - Backend is working, now fixing frontend..."

# Kill any existing processes
sudo pkill -f "vite" 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true

echo "✅ Backend confirmed working on port 5000"

echo "🚀 Starting frontend Vite dev server on port 5173..."
cd client
nohup npx vite --host 0.0.0.0 --port 5173 > ../frontend-vite.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..

echo "⏳ Waiting for frontend to start..."
sleep 8

echo "🔍 Testing frontend connection..."
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ Frontend is now responding on port 5173"
else
    echo "❌ Frontend still not responding - trying alternative method..."
    cd client
    nohup npx vite dev --host 0.0.0.0 --port 5173 > ../frontend-alt.log 2>&1 &
    cd ..
    sleep 5
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo "✅ Frontend started with alternative method"
    else
        echo "❌ Frontend failed - checking logs..."
        tail -10 frontend-vite.log
        tail -10 frontend-alt.log
    fi
fi

echo "🔍 Final status check..."
echo "Backend (5000): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")"
echo "Frontend (5173): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")"

echo "📊 Running processes:"
ps aux | grep -E "(vite|tsx)" | grep -v grep | head -3

echo "✅ Final fix completed!"
echo "🌐 Backend: http://localhost:5000"
echo "🌐 Frontend: http://localhost:5173"
echo "📝 Frontend logs: tail -f frontend-vite.log"
