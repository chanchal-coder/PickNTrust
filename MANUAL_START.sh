#!/bin/bash

echo "🎯 MANUAL START - Step by step service startup"

# Kill everything first
echo "🧹 Killing all processes..."
sudo pkill -9 -f "node" 2>/dev/null || true
sudo pkill -9 -f "tsx" 2>/dev/null || true
sudo pkill -9 -f "vite" 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
sleep 3

echo "✅ All processes killed"

# Check if we have the required executables
echo "🔍 Checking executables..."
if [ -f "./node_modules/.bin/tsx" ]; then
    echo "✅ tsx found"
    TSX_CMD="./node_modules/.bin/tsx"
elif command -v npx >/dev/null 2>&1; then
    echo "✅ npx found, will use npx tsx"
    TSX_CMD="npx tsx"
else
    echo "❌ Neither tsx nor npx found"
    exit 1
fi

if [ -f "./node_modules/.bin/vite" ]; then
    echo "✅ vite found"
    VITE_CMD="./node_modules/.bin/vite"
elif command -v npx >/dev/null 2>&1; then
    echo "✅ npx found, will use npx vite"
    VITE_CMD="npx vite"
else
    echo "❌ Neither vite nor npx found"
    exit 1
fi

# Start backend manually
echo "🚀 Starting backend manually..."
cd /home/ec2-user/PickNTrust
NODE_ENV=development $TSX_CMD server/index.ts > backend-manual.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
sleep 10

# Test backend
echo "🔍 Testing backend..."
if curl -s http://localhost:5000 >/dev/null 2>&1; then
    echo "✅ Backend is responding!"
else
    echo "❌ Backend not responding. Logs:"
    tail -20 backend-manual.log
    echo ""
    echo "🔍 Checking if process is running..."
    ps aux | grep tsx | grep -v grep
fi

# Start frontend manually
echo "🚀 Starting frontend manually..."
cd /home/ec2-user/PickNTrust/client
$VITE_CMD --host 0.0.0.0 --port 5173 > ../frontend-manual.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
cd ..
sleep 10

# Test frontend
echo "🔍 Testing frontend..."
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ Frontend is responding!"
else
    echo "❌ Frontend not responding. Logs:"
    tail -20 frontend-manual.log
    echo ""
    echo "🔍 Checking if process is running..."
    ps aux | grep vite | grep -v grep
fi

echo "📊 Final status:"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

echo "🔍 Testing both services:"
echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")"
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")"

echo "📝 Log files:"
echo "Backend: tail -f backend-manual.log"
echo "Frontend: tail -f frontend-manual.log"

echo "✅ Manual start completed!"
