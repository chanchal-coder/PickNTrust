#!/bin/bash

echo "🎯 DIRECT SERVE - Bypass nginx completely"

# Kill everything
sudo pkill -9 -f "node" 2>/dev/null || true
sudo pkill -9 -f "tsx" 2>/dev/null || true
sudo pkill -9 -f "vite" 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
sleep 3

# Stop nginx to free port 80
echo "🛑 Stopping nginx..."
sudo systemctl stop nginx

# Start frontend directly on port 80 (bypass nginx)
echo "🚀 Starting frontend directly on port 80..."
cd /home/ec2-user/PickNTrust/client
sudo nohup npx vite --host 0.0.0.0 --port 80 > ../frontend-direct.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..
sleep 10

# Test direct connection
echo "🔍 Testing direct connection..."
DIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "FAILED")
echo "Direct port 80 status: $DIRECT_STATUS"

# Test domain
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://pickntrust.com 2>/dev/null || echo "FAILED")
echo "Domain status: $DOMAIN_STATUS"

echo "📊 FINAL STATUS:"
echo "Direct (80): $DIRECT_STATUS"
echo "Domain: $DOMAIN_STATUS"

if [ "$DOMAIN_STATUS" = "200" ] || [ "$DIRECT_STATUS" = "200" ]; then
    echo "🎉 SUCCESS! Direct serving working!"
    echo "✅ No nginx complications"
    echo "🌐 Visit: http://pickntrust.com"
else
    echo "❌ Still having issues. Logs:"
    tail -10 frontend-direct.log
fi

echo "📝 Frontend logs: tail -f frontend-direct.log"
echo "🔄 Frontend PID: $FRONTEND_PID"
echo "✅ DIRECT SERVE COMPLETED!"
