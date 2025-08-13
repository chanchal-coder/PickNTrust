#!/bin/bash

echo "EMERGENCY START - GETTING PICKNTRUST RUNNING"
echo "============================================"

# First, let's see what's actually running
echo "Current PM2 status:"
pm2 status

echo ""
echo "Checking if backend files exist:"
ls -la dist/server/index.js 2>/dev/null && echo "Backend build exists" || echo "Backend build missing"
ls -la dist/public/index.html 2>/dev/null && echo "Frontend build exists" || echo "Frontend build missing"

echo ""
echo "Checking ecosystem config:"
ls -la ecosystem.config.cjs 2>/dev/null && echo "Ecosystem config exists" || echo "Ecosystem config missing"

# Kill everything and start fresh
echo ""
echo "Stopping all services..."
pm2 kill
sudo systemctl stop nginx 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

# Build if needed
if [ ! -f "dist/server/index.js" ]; then
    echo "Building application..."
    npm run build
fi

# Start PM2 with ecosystem config
echo ""
echo "Starting PM2 with ecosystem config..."
pm2 start ecosystem.config.cjs

# Wait a moment
sleep 3

echo ""
echo "PM2 status after start:"
pm2 status

# Test backend
echo ""
echo "Testing backend on port 5000..."
if curl -s http://localhost:5000 > /dev/null; then
    echo "SUCCESS: Backend is responding"
else
    echo "ERROR: Backend not responding"
    echo "Checking PM2 logs:"
    pm2 logs --lines 10
fi

# Fix nginx sites-enabled issue
echo ""
echo "Fixing Nginx configuration..."
sudo rm -rf /etc/nginx/sites-enabled
sudo mkdir -p /etc/nginx/sites-enabled

# Create nginx config
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'NGINXEOF'
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
    }
}
NGINXEOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test and start nginx
echo ""
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "SUCCESS: Nginx config is valid"
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "ERROR: Nginx config invalid"
fi

# Final tests
echo ""
echo "Final connectivity tests..."
sleep 2

if curl -s http://localhost:5000 > /dev/null; then
    echo "✓ Backend responding on port 5000"
else
    echo "✗ Backend NOT responding on port 5000"
fi

if curl -s http://localhost:80 > /dev/null; then
    echo "✓ Nginx responding on port 80"
else
    echo "✗ Nginx NOT responding on port 80"
fi

# Test external
if curl -I http://51.20.43.157 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    echo "✓ External access working at http://51.20.43.157"
else
    echo "✗ External access not working"
fi

echo ""
echo "FINAL STATUS:"
echo "============="
echo "PM2 Status:"
pm2 status
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -3

echo ""
if pm2 status | grep -q "online"; then
    echo "SUCCESS: Your site should be accessible at http://51.20.43.157"
else
    echo "ISSUE: PM2 processes not running properly"
    echo "Run 'pm2 logs' to see what's wrong"
fi
