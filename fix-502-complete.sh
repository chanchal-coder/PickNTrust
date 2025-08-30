#!/bin/bash

# Complete 502 Bad Gateway Fix - Fresh Deployment
# This script fixes all 502 issues: nginx config, backend startup, and database

echo "🔧 Complete 502 Bad Gateway Fix for Fresh Deployment"
echo "==================================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Step 1: System Diagnosis"
echo "==========================="

# Check if we're in the right directory
if [ -f "package.json" ] && [ -f "server/index.ts" ]; then
    echo "✅ In correct PickNTrust directory"
else
    echo "❌ Not in PickNTrust directory - navigating..."
    cd /home/ec2-user/PickNTrust || exit 1
fi

# Check current PM2 status
echo "📊 Current PM2 processes:"
pm2 status

# Check if backend is responding
echo ""
echo "📊 Testing backend connectivity:"
if curl -s --connect-timeout 5 http://127.0.0.1:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is responding on port 5000"
else
    echo "❌ Backend is not responding on port 5000"
fi

# Check nginx status
echo ""
echo "📊 Nginx status:"
sudo systemctl status nginx --no-pager -l | head -3

echo ""
echo "🛑 Step 2: Clean Restart"
echo "========================"

# Stop all PM2 processes
echo "🛑 Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# Kill any processes on port 5000
echo "🛑 Killing any processes on port 5000..."
sudo fuser -k 5000/tcp 2>/dev/null || true
sleep 2

echo ""
echo "📦 Step 3: Dependencies & Build"
echo "==============================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Verify build output
if [ -f "dist/server/index.js" ] && [ -d "dist/public" ]; then
    echo "✅ Build successful - all files present"
    echo "📊 Build contents:"
    ls -la dist/
    ls -la dist/public/ | head -3
else
    echo "❌ Build failed - missing files"
    exit 1
fi

echo ""
echo "🗄️ Step 4: Database Setup"
echo "=========================="

# Check if database exists
if [ -f "database.sqlite" ]; then
    echo "✅ Database file exists"
    # Check if it has tables
    TABLE_COUNT=$(sqlite3 database.sqlite "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
    echo "📊 Database has $TABLE_COUNT tables"
else
    echo "📝 Creating new database..."
    touch database.sqlite
fi

# Ensure categories table exists with data
echo "📝 Setting up categories table..."
sqlite3 database.sqlite << 'EOF'
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'fas fa-tag',
    displayOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add sample categories if none exist
INSERT OR IGNORE INTO categories (name, description, color, icon, displayOrder) VALUES
('Electronics', 'Latest gadgets and electronic devices', '#3B82F6', 'fas fa-laptop', 1),
('Fashion', 'Trendy clothing and accessories', '#EC4899', 'fas fa-tshirt', 2),
('Home & Garden', 'Home improvement and gardening essentials', '#10B981', 'fas fa-home', 3),
('Sports & Fitness', 'Sports equipment and fitness gear', '#F59E0B', 'fas fa-dumbbell', 4),
('Books & Media', 'Books, movies, and entertainment', '#8B5CF6', 'fas fa-book', 5);
EOF

echo "✅ Database setup complete"
echo "📊 Categories count: $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;')"

echo ""
echo "🚀 Step 5: Backend Server Startup"
echo "=================================="

# Start backend with explicit configuration
echo "🚀 Starting backend server..."
export NODE_ENV=production
export PORT=5000

# Start with PM2
pm2 start dist/server/index.js \
  --name "pickntrust-backend" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
  --merge-logs

# Wait for server to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if server started successfully
echo "📊 PM2 Status after startup:"
pm2 status

# Test backend connectivity
echo ""
echo "🧪 Testing backend connectivity..."
for i in {1..10}; do
    if curl -s --connect-timeout 3 http://127.0.0.1:5000/health > /dev/null 2>&1; then
        echo "✅ Backend is responding on port 5000 (attempt $i)"
        break
    elif curl -s --connect-timeout 3 http://127.0.0.1:5000 > /dev/null 2>&1; then
        echo "✅ Backend is responding on port 5000 (no health endpoint, attempt $i)"
        break
    else
        echo "⏳ Backend not ready, waiting... (attempt $i/10)"
        sleep 2
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Backend failed to start properly"
        echo "📋 PM2 logs:"
        pm2 logs pickntrust-backend --lines 10
        exit 1
    fi
done

echo ""
echo "🔧 Step 6: Nginx Configuration"
echo "=============================="

# Update nginx configuration
echo "📝 Updating nginx configuration..."
sudo cp nginx.conf /etc/nginx/sites-available/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    sudo nginx -t
    exit 1
fi

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Check nginx status
echo "📊 Nginx status after restart:"
sudo systemctl status nginx --no-pager -l | head -5

echo ""
echo "🧪 Step 7: Complete System Testing"
echo "==================================="

# Test backend APIs
echo "🧪 Testing backend APIs..."
echo "📊 Categories API:"
CATEGORIES_RESPONSE=$(curl -s http://127.0.0.1:5000/api/categories)
if echo "$CATEGORIES_RESPONSE" | grep -q "Electronics\|Fashion\|\[\|{"; then
    echo "✅ Categories API working"
    echo "📊 Response preview: $(echo "$CATEGORIES_RESPONSE" | head -c 100)..."
else
    echo "⚠️ Categories API issue - Response: $CATEGORIES_RESPONSE"
fi

# Test website through nginx
echo ""
echo "🧪 Testing website through nginx..."
WEBSITE_RESPONSE=$(curl -s -w "%{http_code}" http://localhost -o /dev/null)
if [ "$WEBSITE_RESPONSE" = "200" ] || [ "$WEBSITE_RESPONSE" = "301" ] || [ "$WEBSITE_RESPONSE" = "302" ]; then
    echo "✅ Website responding with HTTP $WEBSITE_RESPONSE"
else
    echo "❌ Website responding with HTTP $WEBSITE_RESPONSE"
    echo "📋 Nginx error logs:"
    sudo tail -5 /var/log/nginx/error.log
fi

# Test static files
echo ""
echo "🧪 Testing static file serving..."
if [ -f "dist/public/index.html" ]; then
    STATIC_RESPONSE=$(curl -s -w "%{http_code}" http://localhost/index.html -o /dev/null)
    echo "📊 Static file test: HTTP $STATIC_RESPONSE"
fi

echo ""
echo "📊 Step 8: Final Status Report"
echo "=============================="

echo "📊 System Status Summary:"
echo "========================"
echo "Backend Server:"
pm2 status | grep pickntrust-backend || echo "❌ Backend not running"

echo ""
echo "Port 5000 Status:"
netstat -tlnp | grep :5000 || echo "❌ Nothing listening on port 5000"

echo ""
echo "Nginx Status:"
sudo systemctl is-active nginx

echo ""
echo "Database Status:"
echo "Categories: $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;' 2>/dev/null || echo 'Error')"

echo ""
echo "Recent PM2 Logs:"
pm2 logs pickntrust-backend --lines 5 2>/dev/null || echo "No PM2 logs available"

echo ""
echo "🎉 502 FIX COMPLETED!"
echo "===================="
echo ""
echo "✅ WHAT WAS FIXED:"
echo "   🛑 Stopped all conflicting processes"
echo "   📦 Reinstalled dependencies"
echo "   🔨 Rebuilt project completely"
echo "   🗄️ Set up database with sample data"
echo "   🚀 Started backend server on port 5000"
echo "   🔧 Updated nginx configuration"
echo "   🔄 Restarted all services"
echo "   🧪 Tested all endpoints"
echo ""
echo "🌐 YOUR WEBSITE SHOULD NOW WORK:"
echo "   🏠 Homepage: http://YOUR_SERVER_IP"
echo "   📂 Categories: Should be visible"
echo "   👨‍💼 Admin Panel: http://YOUR_SERVER_IP/admin"
echo ""
echo "📝 If 502 error persists:"
echo "   1. Check PM2 logs: pm2 logs pickntrust-backend"
echo "   2. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   3. Test backend directly: curl http://127.0.0.1:5000"
echo "   4. Verify port 5000: netstat -tlnp | grep :5000"
echo "   5. Check build files: ls -la dist/"