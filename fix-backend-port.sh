#!/bin/bash

# Fix Backend Port Issue - Connection Refused Error
# This script diagnoses and fixes backend port binding issues

echo "🔍 Diagnosing Backend Port Issue"
echo "=================================="

# Check what's running on port 5000
echo "📊 Checking port 5000 status..."
if netstat -tlnp | grep :5000; then
    echo "✅ Something is listening on port 5000"
else
    echo "❌ Nothing is listening on port 5000"
fi

# Check all Node.js processes and their ports
echo ""
echo "📊 Checking all Node.js processes..."
ps aux | grep node | grep -v grep

echo ""
echo "📊 Checking all listening ports..."
netstat -tlnp | grep node

# Check PM2 processes in detail
echo ""
echo "📊 PM2 Process Details:"
pm2 show pickntrust-app
pm2 show pickntrust-backend

# Check PM2 logs for port information
echo ""
echo "📊 Recent PM2 logs:"
pm2 logs --lines 20

# Stop all PM2 processes
echo ""
echo "🛑 Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# Check if anything is still using port 5000
echo ""
echo "🔍 Checking if port 5000 is free..."
if netstat -tlnp | grep :5000; then
    echo "⚠️  Port 5000 is still in use, killing processes..."
    sudo fuser -k 5000/tcp 2>/dev/null || true
    sleep 2
fi

# Start the backend server with explicit port binding
echo ""
echo "🚀 Starting backend server on port 5000..."
cd /home/ec2-user/PickNTrust

# Set environment variables explicitly
export NODE_ENV=production
export PORT=5000

# Start with PM2 and explicit configuration
echo "Starting backend server with explicit port 5000..."
pm2 start dist/server/index.js --name "pickntrust-backend" --env NODE_ENV=production --env PORT=5000 -- --port=5000

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is now responding
echo ""
echo "🧪 Testing backend server..."
for i in {1..10}; do
    if curl -s http://127.0.0.1:5000/health > /dev/null 2>&1; then
        echo "✅ Backend server is responding on port 5000"
        break
    elif curl -s http://127.0.0.1:5000 > /dev/null 2>&1; then
        echo "✅ Backend server is responding on port 5000 (no health endpoint)"
        break
    else
        echo "⏳ Attempt $i/10 - Backend not ready, waiting..."
        sleep 2
    fi
done

# Check what's actually listening now
echo ""
echo "📊 Current port status:"
netstat -tlnp | grep :5000

# Test nginx connection to backend
echo ""
echo "🧪 Testing nginx to backend connection..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000 | grep -q "200\|301\|302\|404"; then
    echo "✅ Backend is accessible from nginx"
else
    echo "❌ Backend is not accessible from nginx"
    echo "Checking backend logs..."
    pm2 logs pickntrust-backend --lines 10
fi

# Restart nginx to clear any cached connections
echo ""
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Final test
echo ""
echo "🧪 Final test - checking website..."
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ Website is now working!"
else
    echo "❌ Website still not working"
    echo "Checking nginx error logs..."
    sudo tail -5 /var/log/nginx/error.log
fi

echo ""
echo "📊 Final Status:"
echo "==============="
echo "PM2 Status:"
pm2 status
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l | head -5
echo ""
echo "Port 5000 Status:"
netstat -tlnp | grep :5000

echo ""
echo "🎉 Backend port fix completed!"
echo ""
echo "📝 If still having issues:"
echo "   1. Check PM2 logs: pm2 logs pickntrust-backend"
echo "   2. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   3. Test backend directly: curl http://127.0.0.1:5000"
echo "   4. Test website: curl http://localhost"