#!/bin/bash

echo "🔍 DIAGNOSING CONNECTION REFUSED ISSUE"
echo "======================================"

# Stop all services first
echo "🛑 Step 1: Stopping all services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Kill any processes on ports 80 and 5000
echo "🔪 Step 2: Killing processes on ports 80 and 5000..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

# Check if ports are free
echo "🔍 Step 3: Checking if ports are free..."
netstat -tlnp | grep -E ":(80|5000)" || echo "Ports 80 and 5000 are free"

# Rebuild application
echo "🔨 Step 4: Rebuilding application..."
npm install
npm run build

# Check if build was successful
if [ ! -d "dist" ] || [ ! -f "dist/public/index.html" ]; then
    echo "❌ Build failed - dist/public/index.html not found"
    echo "🔍 Checking build output..."
    ls -la dist/ 2>/dev/null || echo "No dist directory"
    exit 1
else
    echo "✅ Build successful - frontend files found"
fi

# Start backend with PM2
echo "🚀 Step 5: Starting backend..."
NODE_ENV=production pm2 start ecosystem.config.cjs

# Wait for backend to start
sleep 5

# Check if backend is running
echo "🔍 Step 6: Checking backend status..."
pm2 status
if pm2 list | grep -q "online"; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start"
    pm2 logs --lines 10
    exit 1
fi

# Test backend directly
echo "🧪 Step 7: Testing backend directly..."
curl -I http://localhost:5000 2>/dev/null && echo "✅ Backend responding on port 5000" || echo "❌ Backend not responding on port 5000"

# Create nginx config if it doesn't exist
echo "⚙️ Step 8: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157 pickntrust.com www.pickntrust.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test nginx config
echo "🧪 Step 9: Testing Nginx configuration..."
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Start nginx
echo "🌐 Step 10: Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Check if nginx is running
sleep 2
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    sudo systemctl status nginx --no-pager
    exit 1
fi

# Test nginx
echo "🧪 Step 11: Testing Nginx..."
curl -I http://localhost:80 2>/dev/null && echo "✅ Nginx responding on port 80" || echo "❌ Nginx not responding on port 80"

# Final status check
echo "📊 Step 12: Final status check..."
echo "=== PM2 Status ==="
pm2 status
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l
echo "=== Port Status ==="
netstat -tlnp | grep -E ":(80|5000)"

# Test external access
echo "🌐 Step 13: Testing external access..."
curl -I http://51.20.43.157 2>/dev/null && echo "✅ Site accessible externally" || echo "❌ Site not accessible externally"

echo ""
echo "🎉 DIAGNOSIS AND FIX COMPLETE!"
echo "==============================="
echo "🌐 Test your site at: http://51.20.43.157"
echo "🔍 Check logs with: pm2 logs"
echo "🔄 Restart services with: pm2 restart all && sudo systemctl restart nginx"
