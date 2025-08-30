#!/bin/bash

# Fix ESM Module Resolution - Cannot find package 'nodemailer'
# This script fixes ES module resolution issues in the built server

echo "🔧 Fixing ESM Module Resolution Issues"
echo "====================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Step 1: Diagnosing ESM Module Issues"
echo "======================================="

# Stop current backend
echo "🛑 Stopping current backend..."
pm2 stop pickntrust-backend 2>/dev/null || true
pm2 delete pickntrust-backend 2>/dev/null || true

# Check Node.js version
echo "📊 Node.js version: $(node --version)"
echo "📊 NPM version: $(npm --version)"

# Check if nodemailer is actually installed
echo "📊 Checking nodemailer installation:"
npm list nodemailer

echo ""
echo "🔧 Step 2: Fix Package.json for ESM"
echo "==================================="

# Backup package.json
cp package.json package.json.backup

# Check if package.json has type: module
if grep -q '"type": "module"' package.json; then
    echo "✅ Package.json already has type: module"
else
    echo "📝 Adding type: module to package.json..."
    # Add type: module to package.json
    sed -i '2i\  "type": "module",' package.json
fi

echo ""
echo "🔧 Step 3: Fix Build Configuration"
echo "=================================="

# Create a fixed vite config that properly handles externals
echo "📝 Creating ESM-compatible build configuration..."
cat > vite.config.fixed.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        // Keep these as external - don't bundle them
        'nodemailer',
        'better-sqlite3',
        'bcryptjs',
        'jsonwebtoken',
        'multer',
        'sharp',
        'googleapis',
        'canvas'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});
EOF

# Backup original vite config and use the fixed one
if [ -f "vite.config.ts" ]; then
    cp vite.config.ts vite.config.ts.backup
fi
cp vite.config.fixed.ts vite.config.ts

echo ""
echo "🔧 Step 4: Fix Server Build Process"
echo "==================================="

# Create a custom build script that handles ESM properly
echo "📝 Creating ESM-compatible server build..."
cat > build-server.js << 'EOF'
import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build server with proper external handling
esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  outbase: '.',
  external: [
    // Don't bundle these - they should be resolved at runtime
    'nodemailer',
    'better-sqlite3',
    'drizzle-orm',
    'express',
    'cors',
    'helmet',
    'bcryptjs',
    'jsonwebtoken',
    'multer',
    'dotenv',
    'sharp',
    'googleapis',
    'canvas',
    'fs',
    'path',
    'url',
    'crypto',
    'os',
    'util'
  ],
  banner: {
    js: `
    import { createRequire } from 'module';
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';
    const require = createRequire(import.meta.url);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    `
  }
}).then(() => {
  console.log('✅ Server built successfully with ESM support');
}).catch((error) => {
  console.error('❌ Server build failed:', error);
  process.exit(1);
});
EOF

echo ""
echo "📦 Step 5: Install ESBuild and Dependencies"
echo "==========================================="

# Install esbuild if not present
echo "📦 Installing esbuild..."
npm install --save-dev esbuild

# Ensure all external dependencies are installed
echo "📦 Ensuring all external dependencies are installed..."
npm install nodemailer better-sqlite3 drizzle-orm express cors helmet bcryptjs jsonwebtoken multer dotenv

echo ""
echo "🔨 Step 6: Rebuild with ESM Support"
echo "==================================="

# Clean build directory
echo "🗑️ Cleaning build directory..."
rm -rf dist

# Build frontend
echo "🔨 Building frontend..."
npm run build:client 2>/dev/null || vite build

# Build server with ESM support
echo "🔨 Building server with ESM support..."
node build-server.js

# Verify build output
if [ -f "dist/server/index.js" ]; then
    echo "✅ Server build successful"
    echo "📊 Server file size: $(du -h dist/server/index.js | cut -f1)"
else
    echo "❌ Server build failed"
    exit 1
fi

echo ""
echo "🔧 Step 7: Create Node Modules Symlink"
echo "======================================"

# Create symlink to node_modules in dist directory for runtime resolution
echo "📝 Creating node_modules symlink for runtime resolution..."
cd dist
if [ ! -L "node_modules" ] && [ ! -d "node_modules" ]; then
    ln -sf ../node_modules node_modules
    echo "✅ Node modules symlink created"
else
    echo "✅ Node modules already available in dist"
fi
cd ..

echo ""
echo "🧪 Step 8: Test Server Dependencies"
echo "==================================="

# Test if the built server can resolve modules
echo "🧪 Testing server module resolution..."
cd dist
echo "Testing nodemailer import..."
node -e "import('nodemailer').then(() => console.log('✅ nodemailer resolved')).catch(e => console.log('❌ nodemailer failed:', e.message))"
echo "Testing better-sqlite3 import..."
node -e "import('better-sqlite3').then(() => console.log('✅ better-sqlite3 resolved')).catch(e => console.log('❌ better-sqlite3 failed:', e.message))"
cd ..

echo ""
echo "🚀 Step 9: Start Backend with ESM Support"
echo "=========================================="

# Set environment variables
export NODE_ENV=production
export PORT=5000

# Start backend from dist directory with proper module resolution
echo "🚀 Starting backend with ESM module resolution..."
cd dist
pm2 start server/index.js \
  --name "pickntrust-backend" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --node-args="--experimental-specifier-resolution=node" \
  --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
  --merge-logs
cd ..

# Wait for startup
echo "⏳ Waiting for backend startup..."
sleep 8

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🧪 Step 10: Test Backend Connectivity"
echo "====================================="

# Check for module errors
echo "📋 Checking for module resolution errors..."
if pm2 logs pickntrust-backend --lines 10 | grep -i "ERR_MODULE_NOT_FOUND\|Cannot find package"; then
    echo "❌ Still have module resolution errors"
    echo "📋 Recent error logs:"
    pm2 logs pickntrust-backend --lines 15
    
    # Try alternative approach - copy node_modules
    echo "🔧 Trying alternative: copying critical modules..."
    mkdir -p dist/node_modules
    cp -r node_modules/nodemailer dist/node_modules/ 2>/dev/null || true
    cp -r node_modules/better-sqlite3 dist/node_modules/ 2>/dev/null || true
    cp -r node_modules/drizzle-orm dist/node_modules/ 2>/dev/null || true
    
    # Restart backend
    pm2 restart pickntrust-backend
    sleep 5
else
    echo "✅ No module resolution errors detected"
fi

# Test connectivity
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
        echo "❌ Backend still not responding"
        echo "📋 Final error check:"
        pm2 logs pickntrust-backend --lines 20
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
echo "📊 Step 11: Final Status Report"
echo "=============================="

echo "📊 System Status:"
echo "================="
echo "Node.js: $(node --version)"
echo "Package type: $(grep '"type"' package.json || echo 'Not set')"
echo "PM2 Status:"
pm2 status

echo ""
echo "Module Resolution:"
echo "=================="
echo "Nodemailer: $(npm list nodemailer 2>/dev/null | grep nodemailer || echo 'Not found')"
echo "Better-sqlite3: $(npm list better-sqlite3 2>/dev/null | grep better-sqlite3 || echo 'Not found')"
echo "Dist node_modules: $([ -e dist/node_modules ] && echo 'Available' || echo 'Missing')"

echo ""
echo "🎉 ESM MODULE RESOLUTION FIX COMPLETED!"
echo "======================================="
echo ""
echo "✅ WHAT WAS FIXED:"
echo "   📝 Added type: module to package.json"
echo "   🔧 Fixed build configuration for ESM"
echo "   📦 Ensured external dependencies available"
echo "   🔗 Created node_modules symlink in dist"
echo "   🚀 Started backend with ESM support"
echo "   🧪 Tested module resolution"
echo ""
echo "🌐 YOUR BACKEND SHOULD NOW WORK:"
echo "   🚀 Backend: http://127.0.0.1:5000"
echo "   📂 Categories API: http://127.0.0.1:5000/api/categories"
echo "   🏥 Health Check: http://127.0.0.1:5000/health"
echo ""
echo "📝 If ESM errors persist:"
echo "   1. Check Node.js version: node --version (18+ required)"
echo "   2. Verify package.json type: grep type package.json"
echo "   3. Check module resolution: node -e \"import('nodemailer')\""
echo "   4. Review PM2 logs: pm2 logs pickntrust-backend"
echo "   5. Test from dist directory: cd dist && node server/index.js"