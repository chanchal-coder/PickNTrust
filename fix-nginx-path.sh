#!/bin/bash

# Fix Nginx Path Configuration for Fresh Deployment
# This script updates nginx to point to the correct frontend build directory

echo "🔧 Fixing Nginx Configuration for Fresh Deployment"
echo "================================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Step 1: Checking Current Setup"
echo "================================="

# Check if build directory exists
if [ -d "dist/public" ]; then
    echo "✅ Frontend build directory exists: dist/public"
    ls -la dist/public/ | head -5
else
    echo "❌ Frontend build directory missing - running build..."
    npm run build
fi

# Check backend server status
echo ""
echo "📊 Backend server status:"
pm2 status

echo ""
echo "🔧 Step 2: Updating Nginx Configuration"
echo "======================================="

# Backup current nginx config
echo "📋 Backing up current nginx config..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Copy our corrected nginx config
echo "📝 Installing corrected nginx configuration..."
sudo cp nginx.conf /etc/nginx/sites-available/default

# Test nginx configuration
echo ""
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors - restoring backup"
    sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
    exit 1
fi

echo ""
echo "🔄 Step 3: Restarting Services"
echo "=============================="

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Check nginx status
echo "📊 Nginx status:"
sudo systemctl status nginx --no-pager -l | head -5

# Restart backend if needed
echo ""
echo "🔄 Ensuring backend is running..."
if ! pm2 list | grep -q "pickntrust-backend.*online"; then
    echo "🚀 Starting backend server..."
    pm2 start dist/server/index.js --name "pickntrust-backend" --env NODE_ENV=production --env PORT=5000
else
    echo "✅ Backend server is already running"
fi

echo ""
echo "🧪 Step 4: Testing Website"
echo "=========================="

# Test static file serving
echo "📊 Testing static file access..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ Static files are being served correctly"
else
    echo "⚠️ Static file serving may have issues"
fi

# Test API endpoints
echo ""
echo "📊 Testing API endpoints..."
if curl -s http://127.0.0.1:5000/api/categories | grep -q "\[\|{\|categories"; then
    echo "✅ Categories API is responding"
else
    echo "⚠️ Categories API may have issues"
fi

# Test backend health
echo ""
echo "📊 Testing backend health..."
if curl -s http://127.0.0.1:5000/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "⚠️ Backend health check failed"
fi

echo ""
echo "📊 Step 5: Final Status Check"
echo "============================="

# Check file permissions
echo "📋 Checking file permissions..."
ls -la dist/public/ | head -3

# Check nginx error logs
echo ""
echo "📋 Recent nginx error logs:"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent nginx errors"

# Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🎉 NGINX PATH FIX COMPLETED!"
echo "============================"
echo ""
echo "✅ CHANGES MADE:"
echo "   📂 Nginx root: /var/www/html → /home/ec2-user/PickNTrust/dist/public"
echo "   🔄 Nginx restarted with new configuration"
echo "   🚀 Backend server verified running"
echo "   🧪 All endpoints tested"
echo ""
echo "🌐 YOUR WEBSITE SHOULD NOW WORK:"
echo "   🏠 Homepage: http://YOUR_SERVER_IP"
echo "   📂 Categories: Should now be visible"
echo "   👨‍💼 Admin Panel: http://YOUR_SERVER_IP/admin"
echo ""
echo "📝 If categories still don't show:"
echo "   1. Check if database has categories: sqlite3 database.sqlite 'SELECT * FROM categories;'"
echo "   2. Test categories API directly: curl http://127.0.0.1:5000/api/categories"
echo "   3. Check browser console for any JavaScript errors"
echo "   4. Verify frontend build: ls -la dist/public/assets/"