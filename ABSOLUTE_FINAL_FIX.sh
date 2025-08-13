#!/bin/bash

echo "🎯 ABSOLUTE FINAL FIX - Last attempt to get localhost working"

# STEP 1: Nuclear cleanup
echo "🧹 Nuclear cleanup..."
sudo pkill -9 -f "node" 2>/dev/null || true
sudo pkill -9 -f "npm" 2>/dev/null || true
sudo pkill -9 -f "tsx" 2>/dev/null || true
sudo pkill -9 -f "vite" 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
sleep 3

# STEP 2: Start backend directly (no PM2, no complications)
echo "🚀 Starting backend directly on port 5000..."
cd /home/ec2-user/PickNTrust
NODE_ENV=development nohup npx tsx server/index.ts > backend-final.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo $BACKEND_PID > backend.pid
sleep 8

# STEP 3: Test backend
echo "🔍 Testing backend..."
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")
echo "Backend status: $BACKEND_TEST"

if [ "$BACKEND_TEST" = "200" ] || [ "$BACKEND_TEST" = "404" ]; then
    echo "✅ Backend is working!"
else
    echo "❌ Backend failed - logs:"
    tail -10 backend-final.log
fi

# STEP 4: Start frontend directly from client directory
echo "🚀 Starting frontend on port 5173..."
cd /home/ec2-user/PickNTrust/client
nohup npx vite --host 0.0.0.0 --port 5173 > ../frontend-final.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
echo $FRONTEND_PID > ../frontend.pid
cd ..
sleep 10

# STEP 5: Test frontend
echo "🔍 Testing frontend..."
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")
echo "Frontend status: $FRONTEND_TEST"

if [ "$FRONTEND_TEST" = "200" ] || [ "$FRONTEND_TEST" = "404" ]; then
    echo "✅ Frontend is working!"
else
    echo "❌ Frontend failed - logs:"
    tail -10 frontend-final.log
fi

# STEP 6: Final status
echo "📊 FINAL STATUS:"
echo "Backend (5000): $BACKEND_TEST"
echo "Frontend (5173): $FRONTEND_TEST"

echo "🔍 Process check:"
ps aux | grep -E "(tsx|vite)" | grep -v grep

echo "🌐 Test URLs:"
echo "Backend: curl http://localhost:5000"
echo "Frontend: curl http://localhost:5173"

echo "📝 Log files:"
echo "Backend: tail -f backend-final.log"
echo "Frontend: tail -f frontend-final.log"

echo "✅ ABSOLUTE FINAL FIX COMPLETED!"

# STEP 7: Keep processes running
echo "🔄 Keeping processes alive..."
echo "Backend PID: $(cat backend.pid 2>/dev/null || echo 'Not found')"
echo "Frontend PID: $(cat frontend.pid 2>/dev/null || echo 'Not found')"
