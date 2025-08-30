#!/bin/bash

# Fix Missing Dependencies and Duplicate PM2 Processes
# This script resolves the nodemailer dependency issue and cleans up PM2

echo "🔧 Fixing Missing Dependencies and PM2 Issues"
echo "============================================="

# Stop all PM2 processes
echo "🛑 Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# Clear PM2 logs
echo "🗑️ Clearing PM2 logs..."
pm2 flush

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📦 Current package.json dependencies:"
if [ -f "package.json" ]; then
    grep -A 20 '"dependencies"' package.json
else
    echo "❌ package.json not found!"
fi

# Install missing dependencies
echo ""
echo "📦 Installing missing dependencies..."
npm install nodemailer
npm install @types/nodemailer --save-dev

# Install all dependencies to ensure nothing is missing
echo "📦 Installing all dependencies..."
npm install

# Rebuild the project
echo ""
echo "🔨 Rebuilding the project..."
npm run build

# Check if build was successful
if [ -f "dist/server/index.js" ]; then
    echo "✅ Build successful - dist/server/index.js exists"
else
    echo "❌ Build failed - dist/server/index.js not found"
    exit 1
fi

# Test the built server for missing dependencies
echo ""
echo "🧪 Testing built server for missing dependencies..."
echo "Testing server startup..."
timeout 10s node dist/server/index.js 2>&1 | head -20

echo ""
echo "🚀 Starting single backend process with PM2..."
# Start only ONE backend process with proper configuration
export NODE_ENV=production
export PORT=5000

# Start with explicit environment variables
pm2 start dist/server/index.js \
  --name "pickntrust-backend" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
  --merge-logs

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 status

# Check if server is responding
echo ""
echo "🧪 Testing backend server..."
for i in {1..10}; do
    if curl -s http://127.0.0.1:5000 > /dev/null 2>&1; then
        echo "✅ Backend server is responding on port 5000"
        break
    else
        echo "⏳ Attempt $i/10 - Backend not ready, waiting..."
        sleep 2
    fi
done

# Check for any errors in PM2 logs
echo ""
echo "📋 Recent PM2 logs (checking for errors):"
pm2 logs --lines 10

# Verify port 5000 is in use
echo ""
echo "📊 Port 5000 status:"
if netstat -tlnp | grep :5000; then
    echo "✅ Port 5000 is in use"
else
    echo "❌ Port 5000 is not in use - server may have crashed"
    echo "Checking PM2 logs for errors..."
    pm2 logs --lines 20
fi

# Restart nginx
echo ""
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Final test
echo ""
echo "🧪 Final website test..."
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ Website is working!"
else
    echo "❌ Website still not working"
    echo "Nginx error logs:"
    sudo tail -5 /var/log/nginx/error.log
    echo "PM2 error logs:"
    pm2 logs --lines 10
fi

echo ""
echo "📊 Final Status Summary:"
echo "======================="
echo "PM2 Processes:"
pm2 status
echo ""
echo "Port 5000:"
netstat -tlnp | grep :5000
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l | head -3

echo ""
echo "🎉 Dependency fix completed!"
echo ""
echo "📝 Key Changes Made:"
echo "   ✅ Installed missing nodemailer dependency"
echo "   ✅ Cleaned up duplicate PM2 processes"
echo "   ✅ Started single backend process on port 5000"
echo "   ✅ Rebuilt project with all dependencies"
echo ""
echo "📝 If still having issues:"
echo "   1. Check dependencies: npm list nodemailer"
echo "   2. Check PM2 logs: pm2 logs pickntrust-backend"
echo "   3. Test backend: curl http://127.0.0.1:5000"
echo "   4. Check nginx: sudo tail -f /var/log/nginx/error.log"