#!/bin/bash

# Fix Missing Modules Error - Backend Startup Issue
# This script resolves ERR_MODULE_NOT_FOUND errors preventing backend startup

echo "🔧 Fixing Missing Modules Error"
echo "==============================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Step 1: Diagnosing Missing Modules"
echo "====================================="

# Stop current backend
echo "🛑 Stopping current backend..."
pm2 stop pickntrust-backend 2>/dev/null || true
pm2 delete pickntrust-backend 2>/dev/null || true

# Check recent error logs for specific missing modules
echo "📋 Checking for missing module errors..."
if [ -f "/home/ec2-user/.pm2/logs/pickntrust-backend-error.log" ]; then
    echo "Recent module errors:"
    grep -i "ERR_MODULE_NOT_FOUND\|Cannot find module" /home/ec2-user/.pm2/logs/pickntrust-backend-error.log | tail -5
fi

echo ""
echo "📦 Step 2: Complete Dependency Reinstall"
echo "========================================"

# Remove node_modules and package-lock to ensure clean install
echo "🗑️ Removing existing node_modules..."
rm -rf node_modules
rm -f package-lock.json

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install dependencies with verbose logging
echo "📦 Installing all dependencies..."
npm install --verbose

# Install commonly missing dependencies explicitly
echo "📦 Installing commonly missing modules..."
npm install nodemailer @types/nodemailer
npm install better-sqlite3
npm install drizzle-orm
npm install express cors helmet
npm install dotenv
npm install multer @types/multer
npm install bcryptjs @types/bcryptjs
npm install jsonwebtoken @types/jsonwebtoken

# Verify critical dependencies
echo ""
echo "✅ Verifying installed dependencies..."
echo "📊 Critical modules check:"
npm list nodemailer 2>/dev/null && echo "✅ nodemailer installed" || echo "❌ nodemailer missing"
npm list better-sqlite3 2>/dev/null && echo "✅ better-sqlite3 installed" || echo "❌ better-sqlite3 missing"
npm list drizzle-orm 2>/dev/null && echo "✅ drizzle-orm installed" || echo "❌ drizzle-orm missing"
npm list express 2>/dev/null && echo "✅ express installed" || echo "❌ express missing"

echo ""
echo "🔨 Step 3: Rebuild Project"
echo "==========================="

# Clean build directory
echo "🗑️ Cleaning build directory..."
rm -rf dist

# Rebuild project
echo "🔨 Building project..."
npm run build

# Verify build output
if [ -f "dist/server/index.js" ]; then
    echo "✅ Build successful - server file exists"
    echo "📊 Build size: $(du -h dist/server/index.js | cut -f1)"
else
    echo "❌ Build failed - server file missing"
    exit 1
fi

echo ""
echo "🧪 Step 4: Test Built Server"
echo "============================="

# Test the built server for missing dependencies
echo "🧪 Testing built server for missing modules..."
echo "Running quick dependency test..."
timeout 10s node dist/server/index.js 2>&1 | head -10 | grep -i "error\|missing\|not found" || echo "✅ No obvious module errors detected"

echo ""
echo "🚀 Step 5: Start Backend with Error Handling"
echo "============================================="

# Set environment variables
export NODE_ENV=production
export PORT=5000

# Start backend with enhanced error logging
echo "🚀 Starting backend with enhanced logging..."
pm2 start dist/server/index.js \
  --name "pickntrust-backend" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
  --merge-logs \
  --max-restarts=3 \
  --restart-delay=5000

# Wait for startup
echo "⏳ Waiting for backend startup..."
sleep 8

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Check for startup errors
echo ""
echo "📋 Checking for startup errors..."
if pm2 logs pickntrust-backend --lines 10 | grep -i "error\|ERR_MODULE_NOT_FOUND\|Cannot find module"; then
    echo "❌ Still have module errors - checking specific issues..."
    
    # Get the specific missing module
    MISSING_MODULE=$(pm2 logs pickntrust-backend --lines 20 | grep -o "Cannot find package '[^']*'" | head -1 | sed "s/Cannot find package '\([^']*\)'.*/\1/")
    if [ ! -z "$MISSING_MODULE" ]; then
        echo "🔍 Detected missing module: $MISSING_MODULE"
        echo "📦 Installing missing module..."
        npm install "$MISSING_MODULE"
        
        # Rebuild and restart
        echo "🔨 Rebuilding after installing missing module..."
        npm run build
        pm2 restart pickntrust-backend
        sleep 5
    fi
else
    echo "✅ No module errors detected in startup logs"
fi

echo ""
echo "🧪 Step 6: Connectivity Testing"
echo "==============================="

# Test backend connectivity with retries
echo "🧪 Testing backend connectivity..."
for i in {1..15}; do
    if curl -s --connect-timeout 3 http://127.0.0.1:5000/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed (attempt $i)"
        break
    elif curl -s --connect-timeout 3 http://127.0.0.1:5000 > /dev/null 2>&1; then
        echo "✅ Backend responding on port 5000 (attempt $i)"
        break
    else
        echo "⏳ Backend not ready, waiting... (attempt $i/15)"
        sleep 3
    fi
    
    if [ $i -eq 15 ]; then
        echo "❌ Backend still not responding after module fixes"
        echo "📋 Final error logs:"
        pm2 logs pickntrust-backend --lines 15
        exit 1
    fi
done

# Test API endpoints
echo ""
echo "🧪 Testing API endpoints..."
echo "📊 Categories API test:"
CATEGORIES_RESPONSE=$(curl -s http://127.0.0.1:5000/api/categories)
if echo "$CATEGORIES_RESPONSE" | grep -q "Electronics\|Fashion\|\[\|{"; then
    echo "✅ Categories API working"
else
    echo "⚠️ Categories API response: $CATEGORIES_RESPONSE"
fi

echo ""
echo "📊 Step 7: Final Status Report"
echo "=============================="

echo "📊 System Status:"
echo "================="
echo "PM2 Processes:"
pm2 status

echo ""
echo "Port 5000 Status:"
netstat -tlnp | grep :5000 || echo "❌ Nothing listening on port 5000"

echo ""
echo "Dependencies Status:"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Package.json exists: $([ -f package.json ] && echo 'Yes' || echo 'No')"
echo "Node_modules exists: $([ -d node_modules ] && echo 'Yes' || echo 'No')"
echo "Build output exists: $([ -f dist/server/index.js ] && echo 'Yes' || echo 'No')"

echo ""
echo "Recent Error Logs (if any):"
pm2 logs pickntrust-backend --lines 5 | grep -i "error" || echo "No recent errors"

echo ""
echo "🎉 MISSING MODULES FIX COMPLETED!"
echo "=================================="
echo ""
echo "✅ WHAT WAS FIXED:"
echo "   🗑️ Cleaned node_modules and npm cache"
echo "   📦 Reinstalled all dependencies"
echo "   📦 Added commonly missing modules"
echo "   🔨 Rebuilt project completely"
echo "   🧪 Tested for module errors"
echo "   🚀 Started backend with error handling"
echo "   ✅ Verified connectivity"
echo ""
echo "🌐 YOUR BACKEND SHOULD NOW BE WORKING:"
echo "   🚀 Backend: http://127.0.0.1:5000"
echo "   📂 Categories API: http://127.0.0.1:5000/api/categories"
echo "   🏥 Health Check: http://127.0.0.1:5000/health"
echo ""
echo "📝 If backend still fails:"
echo "   1. Check specific error: pm2 logs pickntrust-backend"
echo "   2. Verify Node.js version: node --version (should be 18+)"
echo "   3. Check build output: ls -la dist/server/"
echo "   4. Test direct execution: node dist/server/index.js"
echo "   5. Verify dependencies: npm list --depth=0"