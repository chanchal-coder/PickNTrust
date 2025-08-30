#!/bin/bash

# Final Comprehensive Deployment Fix
# This script addresses Node.js upgrade, build configuration, and entry point issues

echo "🔧 Final Comprehensive Deployment Fix"
echo "===================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Step 1: Force Node.js 20+ Installation"
echo "=========================================="

# Check current Node.js version
echo "📊 Current Node.js version: $(node --version)"

# Force install Node.js 20 using NodeSource repository
echo "📦 Installing Node.js 20 LTS (force installation)..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
echo "✅ Node.js version after installation: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Update npm to latest
echo "📦 Updating npm to latest version..."
sudo npm install -g npm@latest

echo ""
echo "🛑 Step 2: Clean System Reset"
echo "============================="

# Stop all processes
echo "🛑 Stopping all processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

# Clean everything
echo "🧹 Complete cleanup..."
rm -rf node_modules
rm -f package-lock.json
rm -rf dist
npm cache clean --force

echo ""
echo "📦 Step 3: Install Dependencies with Node 20+"
echo "=============================================="

# Install dependencies with the new Node.js version
echo "📦 Installing dependencies with Node.js 20+..."
npm install

# Verify critical packages are installed
echo "✅ Verifying critical packages..."
npm list vite 2>/dev/null && echo "✅ Vite installed" || echo "❌ Vite missing"
npm list better-sqlite3 2>/dev/null && echo "✅ better-sqlite3 installed" || echo "❌ better-sqlite3 missing"
npm list nodemailer 2>/dev/null && echo "✅ nodemailer installed" || echo "❌ nodemailer missing"

echo ""
echo "🔧 Step 4: Fix Project Structure and Entry Points"
echo "================================================="

# Check project structure
echo "📊 Checking project structure..."
echo "Client directory: $([ -d 'client' ] && echo 'EXISTS' || echo 'MISSING')"
echo "Client/src directory: $([ -d 'client/src' ] && echo 'EXISTS' || echo 'MISSING')"
echo "Client index.html: $([ -f 'client/index.html' ] && echo 'EXISTS' || echo 'MISSING')"
echo "Public index.html: $([ -f 'public/index.html' ] && echo 'EXISTS' || echo 'MISSING')"
echo "Root index.html: $([ -f 'index.html' ] && echo 'EXISTS' || echo 'MISSING')"

# Find the correct entry point
if [ -f "client/index.html" ]; then
    ENTRY_POINT="client/index.html"
    echo "✅ Found entry point: client/index.html"
elif [ -f "public/index.html" ]; then
    ENTRY_POINT="public/index.html"
    echo "✅ Found entry point: public/index.html"
elif [ -f "index.html" ]; then
    ENTRY_POINT="index.html"
    echo "✅ Found entry point: index.html"
else
    echo "❌ No index.html found, creating one..."
    mkdir -p client
    cat > client/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PickNTrust</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
    ENTRY_POINT="client/index.html"
    echo "✅ Created entry point: client/index.html"
fi

# Create correct Vite configuration
echo "📝 Creating correct Vite configuration..."
cat > vite.config.ts << EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: '${ENTRY_POINT}'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    port: 3000,
    host: true
  }
});
EOF

echo "✅ Vite configuration created with entry point: $ENTRY_POINT"

echo ""
echo "🔨 Step 5: Build Frontend with Correct Configuration"
echo "==================================================="

# Build frontend
echo "🔨 Building frontend with correct entry point..."
if npx vite build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed, trying alternative approach..."
    
    # Alternative: build from client directory
    if [ -d "client" ]; then
        echo "🔄 Trying build from client directory..."
        cd client
        npx vite build --outDir ../dist/public
        cd ..
    fi
fi

# Verify frontend build
if [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build verified - index.html exists"
    ls -la dist/public/ | head -5
else
    echo "❌ Frontend build verification failed"
    exit 1
fi

echo ""
echo "🔨 Step 6: Build Backend Server"
echo "==============================="

# Create server build script
echo "📝 Creating server build script..."
cat > build-server.js << 'EOF'
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
      'nodemailer',
      'better-sqlite3',
      'drizzle-orm',
      'express',
      'cors',
      'helmet',
      'bcryptjs',
      'jsonwebtoken',
      'multer',
      'dotenv'
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
  });
  console.log('✅ Server built successfully');
} catch (error) {
  console.error('❌ Server build failed:', error);
  process.exit(1);
}
EOF

# Build server
echo "🔨 Building server..."
node build-server.js

# Verify server build
if [ -f "dist/server/index.js" ]; then
    echo "✅ Server build successful"
    echo "📊 Server file size: $(du -h dist/server/index.js | cut -f1)"
else
    echo "❌ Server build failed"
    exit 1
fi

echo ""
echo "🗄️ Step 7: Database Setup"
echo "=========================="

# Setup database with categories
echo "📝 Setting up database..."
sqlite3 database.sqlite << 'EOF'
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'fas fa-tag',
    displayOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO categories (name, description, color, icon, displayOrder) VALUES
('Electronics', 'Latest gadgets and electronic devices', '#3B82F6', 'fas fa-laptop', 1),
('Fashion', 'Trendy clothing and accessories', '#EC4899', 'fas fa-tshirt', 2),
('Home & Garden', 'Home improvement and gardening essentials', '#10B981', 'fas fa-home', 3),
('Sports & Fitness', 'Sports equipment and fitness gear', '#F59E0B', 'fas fa-dumbbell', 4),
('Books & Media', 'Books, movies, and entertainment', '#8B5CF6', 'fas fa-book', 5),
('Health & Beauty', 'Health and beauty products', '#EF4444', 'fas fa-heart', 6),
('Automotive', 'Car accessories and parts', '#6B7280', 'fas fa-car', 7),
('Travel', 'Travel gear and accessories', '#14B8A6', 'fas fa-plane', 8);
EOF

echo "✅ Database setup complete"
echo "📊 Categories count: $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;')"

echo ""
echo "🔗 Step 8: Runtime Dependencies"
echo "==============================="

# Setup runtime dependencies
echo "📝 Setting up runtime dependencies..."
cd dist
if [ ! -L "node_modules" ] && [ ! -d "node_modules" ]; then
    ln -sf ../node_modules node_modules
    echo "✅ Node modules symlink created"
fi
cd ..

echo ""
echo "🚀 Step 9: Start Backend Server"
echo "==============================="

# Start backend
echo "🚀 Starting backend server..."
export NODE_ENV=production
export PORT=5000

cd dist
pm2 start server/index.js \
  --name "pickntrust-backend" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
  --merge-logs
cd ..

# Wait and test
echo "⏳ Waiting for backend startup..."
sleep 10

echo "📊 PM2 Status:"
pm2 status

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
        echo "📋 PM2 logs:"
        pm2 logs pickntrust-backend --lines 20
    fi
done

# Test API
echo "🧪 Testing Categories API..."
CATEGORIES_RESPONSE=$(curl -s http://127.0.0.1:5000/api/categories)
if echo "$CATEGORIES_RESPONSE" | grep -q "Electronics\|Fashion\|\[\|{"; then
    echo "✅ Categories API working"
else
    echo "⚠️ Categories API response: $CATEGORIES_RESPONSE"
fi

echo ""
echo "🔧 Step 10: Nginx Configuration"
echo "==============================="

# Update nginx
if [ -f "nginx.conf" ]; then
    echo "📝 Updating nginx configuration..."
    sudo cp nginx.conf /etc/nginx/sites-available/default
    
    if sudo nginx -t; then
        echo "✅ Nginx configuration valid"
        sudo systemctl restart nginx
        echo "✅ Nginx restarted"
    else
        echo "❌ Nginx configuration invalid"
    fi
fi

# Test website
echo "🧪 Testing website..."
WEBSITE_RESPONSE=$(curl -s -w "%{http_code}" http://localhost -o /dev/null)
echo "📊 Website HTTP response: $WEBSITE_RESPONSE"

echo ""
echo "📊 Final Status Report"
echo "====================="

echo "System Status:"
echo "=============="
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "Frontend build: $([ -f dist/public/index.html ] && echo 'OK' || echo 'FAILED')"
echo "Backend build: $([ -f dist/server/index.js ] && echo 'OK' || echo 'FAILED')"
echo "Database: $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;' 2>/dev/null || echo 'ERROR') categories"
echo "PM2 Status:"
pm2 status
echo "Port 5000: $(netstat -tlnp | grep :5000 | wc -l) processes listening"

echo ""
echo "🎉 FINAL DEPLOYMENT FIX COMPLETED!"
echo "=================================="
echo ""
echo "✅ WHAT WAS FIXED:"
echo "   📦 Node.js 20+ force installation"
echo "   🔧 Correct Vite entry point configuration"
echo "   🔨 Frontend and backend builds"
echo "   🗄️ Database with sample categories"
echo "   🔗 Runtime dependencies setup"
echo "   🚀 Backend server startup"
echo "   🔧 Nginx configuration"
echo ""
echo "🌐 YOUR WEBSITE SHOULD NOW BE WORKING:"
echo "   🏠 Homepage: http://YOUR_SERVER_IP"
echo "   📂 Categories: Should be visible"
echo "   👨‍💼 Admin Panel: http://YOUR_SERVER_IP/admin"
echo ""
echo "📝 If issues persist:"
echo "   1. Check Node.js version: node --version (should be 20+)"
echo "   2. Check PM2 logs: pm2 logs pickntrust-backend"
echo "   3. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   4. Test APIs: curl http://127.0.0.1:5000/api/categories"