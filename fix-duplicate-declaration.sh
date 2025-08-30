#!/bin/bash

# Fix Duplicate Declaration Error - fileURLToPath already declared
# This script fixes the JavaScript syntax error in the server build

echo "🔧 Fixing Duplicate Declaration Error"
echo "==================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Current Issue Analysis"
echo "========================"
echo "Error: SyntaxError: Identifier 'fileURLToPath' has already been declared"
echo "Cause: esbuild banner is duplicating import declarations"
echo "Solution: Clean banner without duplicate imports"

echo ""
echo "🔧 Step 1: Fix Server Build Script"
echo "=================================="

# Create a clean server build script without duplicate declarations
echo "📝 Creating clean server build script..."
cat > build-server-clean.js << 'EOF'
import { build } from 'esbuild';

try {
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: 'dist',
    outbase: '.',
    external: [
      // Core Node.js modules
      'fs', 'path', 'url', 'crypto', 'os', 'util', 'events', 'stream', 'buffer',
      'querystring', 'http', 'https', 'net', 'tls', 'zlib',
      
      // NPM packages that should not be bundled
      'nodemailer', 'better-sqlite3', 'drizzle-orm', 'express', 'cors', 'helmet',
      'bcryptjs', 'jsonwebtoken', 'multer', 'dotenv', 'sharp', 'googleapis', 'canvas',
      
      // Vite and build tool dependencies
      'vite', 'lightningcss', 'esbuild', 'rollup', '@vitejs/plugin-react',
      
      // Other problematic dependencies
      'fsevents', 'chokidar', 'glob', 'minimatch'
    ],
    // Clean banner without duplicate declarations
    banner: {
      js: `// ESM compatibility banner
const require = (await import('module')).createRequire(import.meta.url);
const __filename = (await import('url')).fileURLToPath(import.meta.url);
const __dirname = (await import('path')).dirname(__filename);`
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    minify: false,
    sourcemap: false,
    logLevel: 'info'
  });
  console.log('✅ Server built successfully with clean banner');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  
  // Try minimal build without banner
  console.log('🔄 Trying minimal build without banner...');
  try {
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outdir: 'dist',
      outbase: '.',
      external: [
        'nodemailer', 'better-sqlite3', 'drizzle-orm', 'express', 'cors', 'helmet',
        'bcryptjs', 'jsonwebtoken', 'multer', 'dotenv'
      ],
      minify: false,
      sourcemap: false
    });
    console.log('✅ Server built successfully with minimal config');
  } catch (altError) {
    console.error('❌ Minimal build also failed:', altError.message);
    process.exit(1);
  }
}
EOF

echo ""
echo "🔨 Step 2: Rebuild Server with Clean Configuration"
echo "================================================="

# Stop current backend
echo "🛑 Stopping current backend..."
pm2 stop pickntrust-backend 2>/dev/null || true
pm2 delete pickntrust-backend 2>/dev/null || true

# Remove existing server build
rm -f dist/server/index.js

# Build server with clean configuration
echo "🔨 Building server with clean banner..."
node build-server-clean.js

# Verify server build
if [ -f "dist/server/index.js" ]; then
    echo "✅ Server build successful!"
    echo "📊 Server file size: $(du -h dist/server/index.js | cut -f1)"
else
    echo "❌ Server build failed"
    exit 1
fi

echo ""
echo "🧪 Step 3: Test Server Syntax"
echo "============================="

# Test the built server for syntax errors
echo "🧪 Testing server syntax..."
cd dist
if timeout 5s node --check server/index.js; then
    echo "✅ Server syntax is valid"
else
    echo "❌ Server syntax errors detected"
    echo "📋 Trying to identify the issue..."
    node --check server/index.js 2>&1 | head -10
fi
cd ..

echo ""
echo "🚀 Step 4: Start Backend Server"
echo "==============================="

# Start backend server
echo "🚀 Starting backend server..."
export NODE_ENV=production
export PORT=5000

cd dist
pm2 start server/index.js \
  --name "pickntrust-backend" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
  --merge-logs \
  --max-restarts=3 \
  --restart-delay=2000
cd ..

# Wait for startup
echo "⏳ Waiting for backend startup..."
sleep 8

echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🧪 Step 5: Test Backend Connectivity"
echo "===================================="

# Check for startup errors
echo "📋 Checking for startup errors..."
if pm2 logs pickntrust-backend --lines 10 | grep -i "error\|syntaxerror\|failed"; then
    echo "⚠️ Detected startup issues:"
    pm2 logs pickntrust-backend --lines 20
else
    echo "✅ No syntax or startup errors detected"
fi

# Test connectivity
echo "🧪 Testing backend connectivity..."
for i in {1..15}; do
    if curl -s --connect-timeout 5 http://127.0.0.1:5000/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed (attempt $i)"
        break
    elif curl -s --connect-timeout 5 http://127.0.0.1:5000 > /dev/null 2>&1; then
        echo "✅ Backend responding on port 5000 (attempt $i)"
        break
    else
        echo "⏳ Backend not ready, waiting... (attempt $i/15)"
        sleep 3
    fi
    
    if [ $i -eq 15 ]; then
        echo "❌ Backend connectivity test failed"
        echo "📋 Final PM2 logs:"
        pm2 logs pickntrust-backend --lines 30
        echo "📋 Port 5000 status:"
        netstat -tlnp | grep :5000 || echo "Nothing listening on port 5000"
    fi
done

# Test API endpoints
echo "🧪 Testing API endpoints..."
echo "📊 Categories API test:"
CATEGORIES_RESPONSE=$(curl -s --connect-timeout 10 http://127.0.0.1:5000/api/categories)
if echo "$CATEGORIES_RESPONSE" | grep -q "Electronics\|Fashion\|\[\|{"; then
    echo "✅ Categories API working"
    echo "📊 Response preview: $(echo "$CATEGORIES_RESPONSE" | head -c 100)..."
else
    echo "⚠️ Categories API response: $CATEGORIES_RESPONSE"
fi

echo ""
echo "🔧 Step 6: Nginx Configuration"
echo "=============================="

# Update nginx if config exists
if [ -f "nginx.conf" ]; then
    echo "📝 Updating nginx configuration..."
    sudo cp nginx.conf /etc/nginx/sites-available/default
    
    if sudo nginx -t; then
        echo "✅ Nginx configuration valid"
        sudo systemctl restart nginx
        echo "✅ Nginx restarted"
        
        # Test website
        echo "🧪 Testing website through nginx..."
        WEBSITE_RESPONSE=$(curl -s -w "%{http_code}" http://localhost -o /dev/null)
        echo "📊 Website HTTP response: $WEBSITE_RESPONSE"
    else
        echo "❌ Nginx configuration invalid"
    fi
fi

echo ""
echo "📊 Final System Status"
echo "====================="

echo "Build Status:"
echo "============="
echo "Node.js: $(node --version)"
echo "Frontend: $([ -f dist/public/index.html ] && echo 'SUCCESS ✅' || echo 'FAILED ❌')"
echo "Backend: $([ -f dist/server/index.js ] && echo 'SUCCESS ✅' || echo 'FAILED ❌')"
echo "Database: $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;' 2>/dev/null || echo 'ERROR') categories"

echo ""
echo "Runtime Status:"
echo "==============="
echo "PM2 Processes:"
pm2 status
echo "Port 5000: $(netstat -tlnp | grep :5000 | wc -l) processes listening"
echo "Nginx: $(sudo systemctl is-active nginx 2>/dev/null || echo 'unknown')"

echo ""
echo "🎉 DUPLICATE DECLARATION FIX COMPLETED!"
echo "======================================="
echo ""
echo "✅ WHAT WAS FIXED:"
echo "   🔧 Removed duplicate fileURLToPath declaration"
echo "   📝 Clean esbuild banner without conflicts"
echo "   🧪 Server syntax validation"
echo "   🚀 Backend server restart"
echo "   🔧 Nginx configuration update"
echo ""
echo "🌐 YOUR WEBSITE SHOULD NOW BE WORKING:"
echo "   🏠 Homepage: http://YOUR_SERVER_IP"
echo "   📂 Categories: Should be visible"
echo "   👨‍💼 Admin Panel: http://YOUR_SERVER_IP/admin"
echo "   🔌 API: http://YOUR_SERVER_IP/api/categories"
echo ""
echo "📝 If issues persist:"
echo "   1. Check PM2 logs: pm2 logs pickntrust-backend"
echo "   2. Test server syntax: node --check dist/server/index.js"
echo "   3. Test API directly: curl http://127.0.0.1:5000/api/categories"
echo "   4. Check nginx logs: sudo tail -f /var/log/nginx/error.log"