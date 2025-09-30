#!/bin/bash

echo "🚨 FINAL CONNECTION REFUSED FIX"
echo "==============================="

# Create logs directory
mkdir -p logs

# Stop everything
echo "🛑 Stopping all services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Check build output
echo "🔍 Checking build output..."
if [ -f "dist/server/index.js" ]; then
    echo "✅ Server build found: dist/server/index.js"
else
    echo "❌ Server build missing!"
    ls -la dist/ 2>/dev/null || echo "No dist directory"
    exit 1
fi

if [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build found: dist/public/index.html"
else
    echo "❌ Frontend build missing!"
    ls -la dist/public/ 2>/dev/null || echo "No dist/public directory"
    exit 1
fi

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
pm2 start ecosystem.config.cjs

# Wait and check PM2 status
sleep 3
echo "📊 PM2 Status:"
pm2 status

# Test backend directly
echo "🧪 Testing backend on port 5000..."
for i in {1..5}; do
    if curl -s http://localhost:5000 > /dev/null; then
        echo "✅ Backend responding on port 5000"
        break
    else
        echo "⏳ Attempt $i/5 - Backend not ready, waiting..."
        sleep 2
    fi
done

# Create nginx config
echo "⚙️ Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Remove default nginx config and enable our config
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test nginx config
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start nginx
echo "🌐 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Wait and test nginx
sleep 2
echo "🧪 Testing Nginx on port 80..."
for i in {1..5}; do
    if curl -s http://localhost:80 > /dev/null; then
        echo "✅ Nginx responding on port 80"
        break
    else
        echo "⏳ Attempt $i/5 - Nginx not ready, waiting..."
        sleep 2
    fi
done

# Final comprehensive test
echo "🔍 Final system check..."
echo "=== Processes ==="
ps aux | grep -E "(nginx|node)" | grep -v grep

echo "=== Ports ==="
netstat -tlnp | grep -E ":(80|5000)"

echo "=== PM2 Status ==="
pm2 status

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

# Test external connectivity
echo "🌐 Testing external connectivity..."
curl -I http://51.20.43.157 2>/dev/null && echo "✅ External access working" || echo "❌ External access failed"

echo ""
echo "🎉 FINAL FIX COMPLETE!"
echo "====================="
echo "🌐 Your site: http://51.20.43.157"
echo "🔍 Check PM2 logs: pm2 logs"
echo "🔍 Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
