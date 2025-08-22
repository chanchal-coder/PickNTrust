#!/bin/bash

echo "🛑 Stopping all servers..."

# Stop PM2 processes
echo "Stopping PM2 processes..."
pm2 delete all || true

# Kill processes by PID files if they exist
if [ -f backend.pid ]; then
    echo "Stopping backend process..."
    kill $(cat backend.pid) 2>/dev/null || true
    rm -f backend.pid
fi

if [ -f frontend.pid ]; then
    echo "Stopping frontend process..."
    kill $(cat frontend.pid) 2>/dev/null || true
    rm -f frontend.pid
fi

# Kill any remaining processes on ports 5000 and 5173
echo "Cleaning up any remaining processes on ports 5000 and 5173..."
pkill -f "node.*5000" || true
pkill -f "vite.*5173" || true
pkill -f "start-dev-server" || true

echo "✅ All servers stopped successfully!"
