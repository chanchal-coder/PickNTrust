#!/bin/bash

echo "Starting development server..."

# Kill any existing processes on ports 5000 and 5173
echo "Cleaning up existing processes..."
pkill -f "node.*5000" || true
pkill -f "vite.*5173" || true
sleep 2

# Start backend in background
echo "Starting backend on port 5000..."
NODE_ENV=production node dist/server/index.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Start frontend dev server
echo "Starting frontend dev server on port 5173..."
npx vite --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Save PIDs for later cleanup
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo "✅ Both servers started successfully!"
echo "🔧 Backend: http://localhost:5000"
echo "🌐 Frontend: http://localhost:5173"
echo "📝 To stop servers: kill \$(cat backend.pid frontend.pid)"

# Keep script running
wait
