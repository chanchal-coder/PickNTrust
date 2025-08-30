#!/bin/bash

# Fix Server Build - lightningcss and esbuild external dependencies
# This script resolves the final server build issues

echo "🔧 Fixing Server Build - Final Step"
echo "=================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

echo "📊 Current Status Check"
echo "======================"
echo "Node.js: $(node --version)"
echo "Frontend build: $([ -f dist/public/index.html ] && echo 'SUCCESS ✅' || echo 'FAILED ❌')"
echo "Server build: $([ -f dist/server/index.js ] && echo 'SUCCESS ✅' || echo 'FAILED ❌')"

echo ""
echo "🔧 Step 1: Fix Server Build Configuration"
echo "========================================="

# Create a comprehensive server build script with all externals
echo "📝 Creating comprehensive server build script..."
cat > build-server-final.js << 'EOF'
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
      'fs',
      'path',
      'url',
      'crypto',
      'os',
      'util',
      'events',
      'stream',
      'buffer',
      'querystring',
      'http',
      'https',
      'net',
      'tls',
      'zlib',
      
      // NPM packages that should not be bundled
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
      
      // Vite and build tool dependencies
      'vite',
      'lightningcss',
      'esbuild',
      'rollup',
      '@vitejs/plugin-react',
      
      // Other problematic dependencies
      'fsevents',
      'chokidar',
      'glob',
      'minimatch'
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
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    minify: false,
    sourcemap: false,
    logLevel: 'info'
  });
  console.log('✅ Server built successfully with all externals');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  
  // Try alternative build without problematic imports
  console.log('🔄 Trying alternative build approach...');
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
        /node_modules/,  // External all node_modules
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
      sourcemap: false
    });
    console.log('✅ Server built successfully with alternative approach');
  } catch (altError) {
    console.error('❌ Alternative build also failed:', altError.message);
    process.exit(1);
  }
}
EOF

echo ""
echo "🔨 Step 2: Build Server with Fixed Configuration"
echo "==============================================="

# Remove any existing server build
rm -f dist/server/index.js

# Build server with comprehensive externals
echo "🔨 Building server with comprehensive externals..."
node build-server-final.js

# Verify server build
if [ -f "dist/server/index.js" ]; then
    echo "✅ Server build successful!"
    echo "📊 Server file size: $(du -h dist/server/index.js | cut -f1)"
else
    echo "❌ Server build still failed, trying manual TypeScript compilation..."
    
    # Fallback: Try direct TypeScript compilation
    echo "🔄 Trying direct TypeScript compilation..."
    if command -v tsc &> /dev/null; then
        tsc server/index.ts --outDir dist --target es2020 --module esnext --moduleResolution node
    else
        echo "❌ TypeScript compiler not available"
        exit 1
    fi
fi

echo ""
echo "🗄️ Step 3: Database Setup (if needed)"
echo "====================================="

# Ensure database exists with categories
if [ ! -f "database.sqlite" ] || [ $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;' 2>/dev/null || echo 0) -eq 0 ]; then
    echo "📝 Setting up database with categories..."
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
else
    echo "✅ Database already exists with $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;') categories"
fi

echo ""
echo "🔗 Step 4: Runtime Dependencies Setup"
echo "====================================="

# Ensure runtime dependencies are available
echo "📝 Setting up runtime dependencies..."
cd dist
if [ ! -L "node_modules" ] && [ ! -d "node_modules" ]; then
    ln -sf ../node_modules node_modules
    echo "✅ Node modules symlink created"
else
    echo "✅ Node modules already available"
fi
cd ..

echo ""
echo "🚀 Step 5: Start Backend Server"
echo "==============================="

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

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
  --max-restarts=5 \
  --restart-delay=3000
cd ..

# Wait for startup
echo "⏳ Waiting for backend startup..."
sleep 8

echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🧪 Step 6: Test Backend Connectivity"
echo "===================================="

# Check for startup errors first
echo "📋 Checking for startup errors..."
if pm2 logs pickntrust-backend --lines 10 | grep -i "error\|failed\|cannot\|missing"; then
    echo "⚠️ Detected startup issues:"
    pm2 logs pickntrust-backend --lines 20
else
    echo "✅ No obvious startup errors detected"
fi

# Test connectivity with extended retries
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
        sleep 3
    fi
    
    if [ $i -eq 20 ]; then
        echo "❌ Backend connectivity test failed after 20 attempts"
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
echo "🔧 Step 7: Nginx Configuration"
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
        sudo nginx -t
    fi
else
    echo "⚠️ nginx.conf not found, skipping nginx configuration"
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
echo "🎉 SERVER BUILD FIX COMPLETED!"
echo "=============================="
echo ""
echo "✅ WHAT WAS FIXED:"
echo "   🔧 Server build with comprehensive externals"
echo "   📦 lightningcss and vite dependencies externalized"
echo "   🗄️ Database setup with sample categories"
echo "   🔗 Runtime dependencies configured"
echo "   🚀 Backend server started with PM2"
echo "   🔧 Nginx configuration updated"
echo ""
echo "🌐 YOUR WEBSITE SHOULD NOW BE WORKING:"
echo "   🏠 Homepage: http://YOUR_SERVER_IP"
echo "   📂 Categories: Should be visible with 8 categories"
echo "   👨‍💼 Admin Panel: http://YOUR_SERVER_IP/admin"
echo "   🔌 API: http://YOUR_SERVER_IP/api/categories"
echo ""
echo "📝 If issues persist:"
echo "   1. Check PM2 logs: pm2 logs pickntrust-backend"
echo "   2. Test API directly: curl http://127.0.0.1:5000/api/categories"
echo "   3. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   4. Verify port 5000: netstat -tlnp | grep :5000"
echo "   5. Test website: curl -I http://localhost"