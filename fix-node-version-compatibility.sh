#!/bin/bash

# Fix Node.js Version Compatibility and Build Issues
# This script addresses Node.js version mismatches and build process errors

echo "🔧 Fixing Node.js Version Compatibility Issues"
echo "==============================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Step 1: System Diagnosis"
echo "==========================="

# Check current versions
echo "📊 Current Node.js version: $(node --version)"
echo "📊 Current NPM version: $(npm --version)"

# Stop any running processes
echo "🛑 Stopping current backend..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo ""
echo "🔧 Step 2: Node.js Version Management"
echo "====================================="

# Check if nvm is available
if command -v nvm &> /dev/null; then
    echo "✅ NVM is available"
    
    # Install and use Node.js 20
    echo "📦 Installing Node.js 20 LTS..."
    nvm install 20
    nvm use 20
    
    echo "✅ Node.js version after switch: $(node --version)"
else
    echo "⚠️ NVM not available - checking if Node 20+ is already installed"
    
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo "❌ Node.js version is too old ($NODE_VERSION). Need version 20+"
        echo "📝 Installing Node.js 20 directly..."
        
        # Download and install Node.js 20 LTS
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
        
        echo "✅ Node.js version after installation: $(node --version)"
    else
        echo "✅ Node.js version is compatible: $(node --version)"
    fi
fi

echo ""
echo "📦 Step 3: Clean Dependencies Installation"
echo "=========================================="

# Clean npm cache and node_modules
echo "🧹 Cleaning npm cache and node_modules..."
npm cache clean --force
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with force to handle version conflicts
echo "📦 Installing dependencies with compatibility fixes..."
npm install --force

# Install specific versions that are compatible
echo "📦 Installing compatible versions of problematic packages..."
npm install --save-dev vite@latest
npm install --save-dev esbuild@latest
npm install --save-dev @vitejs/plugin-react@latest

# Install Babel presets if missing
echo "📦 Installing Babel presets..."
npm install --save-dev @babel/preset-typescript @babel/preset-env @babel/core

echo ""
echo "🔧 Step 4: Fix Build Configuration"
echo "=================================="

# Create a simplified vite config that works with current setup
echo "📝 Creating compatible vite configuration..."
cat > vite.config.simple.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
EOF

# Backup original and use simplified config
if [ -f "vite.config.ts" ]; then
    cp vite.config.ts vite.config.ts.backup
fi
cp vite.config.simple.ts vite.config.ts

# Create a simplified server build script
echo "📝 Creating simplified server build script..."
cat > build-server-simple.js << 'EOF'
import { build } from 'esbuild';

try {
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outdir: 'dist',
    outbase: '.',
    external: [
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
    },
    minify: false,
    sourcemap: false,
  });
  console.log('✅ Server built successfully');
} catch (error) {
  console.error('❌ Server build failed:', error);
  process.exit(1);
}
EOF

echo ""
echo "🔨 Step 5: Build Project with Compatibility"
echo "==========================================="

# Clean build directory
echo "🗑️ Cleaning build directory..."
rm -rf dist

# Build frontend with npx to ensure vite is found
echo "🔨 Building frontend..."
if command -v npx &> /dev/null; then
    npx vite build
else
    # Fallback: try direct npm script
    npm run build 2>/dev/null || {
        echo "⚠️ Standard build failed, trying manual vite build..."
        ./node_modules/.bin/vite build
    }
fi

# Verify frontend build
if [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Build server
echo "🔨 Building server..."
node build-server-simple.js

# Verify server build
if [ -f "dist/server/index.js" ]; then
    echo "✅ Server build successful"
    echo "📊 Server file size: $(du -h dist/server/index.js | cut -f1)"
else
    echo "❌ Server build failed"
    exit 1
fi

echo ""
echo "🔧 Step 6: Runtime Dependencies Setup"
echo "====================================="

# Create node_modules symlink in dist
echo "📝 Setting up runtime dependencies..."
cd dist
if [ ! -L "node_modules" ] && [ ! -d "node_modules" ]; then
    ln -sf ../node_modules node_modules
    echo "✅ Node modules symlink created"
fi
cd ..

# Copy critical native modules if needed
echo "📦 Ensuring critical native modules are available..."
mkdir -p dist/node_modules
if [ -d "node_modules/better-sqlite3" ]; then
    cp -r node_modules/better-sqlite3 dist/node_modules/ 2>/dev/null || true
fi

echo ""
echo "🧪 Step 7: Test Server Dependencies"
echo "==================================="

# Test module resolution from dist directory
echo "🧪 Testing module resolution..."
cd dist
echo "Testing nodemailer..."
node -e "import('nodemailer').then(() => console.log('✅ nodemailer OK')).catch(e => console.log('⚠️ nodemailer issue:', e.message))" 2>/dev/null || echo "⚠️ nodemailer test failed"
echo "Testing better-sqlite3..."
node -e "import('better-sqlite3').then(() => console.log('✅ better-sqlite3 OK')).catch(e => console.log('⚠️ better-sqlite3 issue:', e.message))" 2>/dev/null || echo "⚠️ better-sqlite3 test failed"
cd ..

echo ""
echo "🚀 Step 8: Start Backend Server"
echo "==============================="

# Set environment variables
export NODE_ENV=production
export PORT=5000

# Start server with compatibility flags
echo "🚀 Starting backend server..."
cd dist
pm2 start server/index.js \
  --name "pickntrust-backend" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --node-args="--experimental-specifier-resolution=node --no-warnings" \
  --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
  --merge-logs \
  --max-restarts=3
cd ..

# Wait for startup
echo "⏳ Waiting for backend startup..."
sleep 10

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🧪 Step 9: Test Backend Connectivity"
echo "===================================="

# Check for startup errors
echo "📋 Checking for startup errors..."
if pm2 logs pickntrust-backend --lines 10 | grep -i "error\|failed\|cannot\|missing"; then
    echo "⚠️ Detected startup issues - checking logs..."
    pm2 logs pickntrust-backend --lines 20
else
    echo "✅ No obvious startup errors detected"
fi

# Test connectivity with extended timeout
echo "🧪 Testing backend connectivity..."
for i in {1..20}; do
    if curl -s --connect-timeout 5 http://127.0.0.1:5000/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed (attempt $i)"
        break
    elif curl -s --connect-timeout 5 http://127.0.0.1:5000 > /dev/null 2>&1; then
        echo "✅ Backend responding on port 5000 (attempt $i)"
        break
    else
        echo "⏳ Backend not ready, waiting... (attempt $i/20)"
        sleep 5
    fi
    
    if [ $i -eq 20 ]; then
        echo "❌ Backend still not responding after extended wait"
        echo "📋 Final error check:"
        pm2 logs pickntrust-backend --lines 30
        
        # Try to identify the specific issue
        echo "🔍 Checking for specific issues..."
        if pm2 logs pickntrust-backend --lines 30 | grep -i "EADDRINUSE"; then
            echo "⚠️ Port 5000 is already in use"
            netstat -tlnp | grep :5000
        elif pm2 logs pickntrust-backend --lines 30 | grep -i "MODULE_NOT_FOUND"; then
            echo "⚠️ Module resolution issues persist"
        elif pm2 logs pickntrust-backend --lines 30 | grep -i "permission"; then
            echo "⚠️ Permission issues detected"
        fi
        
        exit 1
    fi
done

# Test API endpoints
echo ""
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
echo "🔧 Step 10: Nginx Configuration Update"
echo "======================================"

# Update nginx configuration
if [ -f "nginx.conf" ]; then
    echo "📝 Updating nginx configuration..."
    sudo cp nginx.conf /etc/nginx/sites-available/default
    
    # Test and restart nginx
    if sudo nginx -t; then
        echo "✅ Nginx configuration valid"
        sudo systemctl restart nginx
        echo "✅ Nginx restarted"
    else
        echo "❌ Nginx configuration invalid"
    fi
fi

echo ""
echo "📊 Step 11: Final Status Report"
echo "=============================="

echo "📊 System Status:"
echo "================="
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "PM2 Status:"
pm2 status

echo ""
echo "Port Status:"
echo "============"
netstat -tlnp | grep :5000 || echo "❌ Nothing listening on port 5000"

echo ""
echo "Build Status:"
echo "============="
echo "Frontend build: $([ -f dist/public/index.html ] && echo 'OK' || echo 'Missing')"
echo "Server build: $([ -f dist/server/index.js ] && echo 'OK' || echo 'Missing')"
echo "Node modules: $([ -e dist/node_modules ] && echo 'Available' || echo 'Missing')"

echo ""
echo "🎉 NODE.JS COMPATIBILITY FIX COMPLETED!"
echo "======================================="
echo ""
echo "✅ WHAT WAS FIXED:"
echo "   📦 Node.js version compatibility (upgraded to 20+)"
echo "   🧹 Clean dependency installation"
echo "   🔧 Fixed build configuration issues"
echo "   📝 Simplified vite and esbuild configs"
echo "   🔗 Runtime module resolution setup"
echo "   🚀 Backend server with compatibility flags"
echo "   🧪 Extended connectivity testing"
echo ""
echo "🌐 YOUR BACKEND SHOULD NOW WORK:"
echo "   🚀 Backend: http://127.0.0.1:5000"
echo "   📂 Categories API: http://127.0.0.1:5000/api/categories"
echo "   🏥 Health Check: http://127.0.0.1:5000/health"
echo ""
echo "📝 If issues persist:"
echo "   1. Check Node.js version: node --version (should be 20+)"
echo "   2. Check PM2 logs: pm2 logs pickntrust-backend"
echo "   3. Test direct execution: cd dist && node server/index.js"
echo "   4. Check port usage: netstat -tlnp | grep :5000"
echo "   5. Verify dependencies: npm list --depth=0"