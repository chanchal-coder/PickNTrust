#!/bin/bash

echo "🎯 WORKING SOLUTION - Based on your successful test results"

# Kill everything
sudo pkill -9 -f "node" 2>/dev/null || true
sudo pkill -9 -f "tsx" 2>/dev/null || true
sudo pkill -9 -f "vite" 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
sleep 3

echo "✅ Processes killed"

# Start backend (this was working in your test)
echo "🚀 Starting backend on port 5000..."
cd /home/ec2-user/PickNTrust
NODE_ENV=development nohup npx tsx server/index.ts > backend-working.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 8

# Test backend
if curl -s http://localhost:5000 >/dev/null 2>&1; then
    echo "✅ Backend is responding!"
    BACKEND_STATUS="WORKING"
else
    echo "❌ Backend not responding"
    BACKEND_STATUS="FAILED"
    tail -10 backend-working.log
fi

# Start frontend (use npx vite from client directory - this was working)
echo "🚀 Starting frontend on port 5173..."
cd /home/ec2-user/PickNTrust/client
nohup npx vite --host 0.0.0.0 --port 5173 > ../frontend-working.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..
sleep 8

# Test frontend
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ Frontend is responding!"
    FRONTEND_STATUS="WORKING"
else
    echo "❌ Frontend not responding"
    FRONTEND_STATUS="FAILED"
    tail -10 frontend-working.log
fi

echo "📊 FINAL STATUS:"
echo "Backend (5000): $BACKEND_STATUS"
echo "Frontend (5173): $FRONTEND_STATUS"

if [ "$BACKEND_STATUS" = "WORKING" ] && [ "$FRONTEND_STATUS" = "WORKING" ]; then
    echo "🎉 SUCCESS! Both services are running!"
    echo "🌐 Backend: http://localhost:5000"
    echo "🌐 Frontend: http://localhost:5173"
    echo "📝 Backend logs: tail -f backend-working.log"
    echo "📝 Frontend logs: tail -f frontend-working.log"
    
    # Save PIDs for monitoring
    echo $BACKEND_PID > backend.pid
    echo $FRONTEND_PID > frontend.pid
    
    echo "🔄 Services will keep running in background"
    echo "🛑 To stop: kill $(cat backend.pid) $(cat frontend.pid)"
else
    echo "❌ Some services failed to start"
    echo "📝 Check logs: tail -f backend-working.log frontend-working.log"
fi

echo "✅ WORKING SOLUTION COMPLETED!"
