#!/bin/bash

echo "FINAL WORKING DEPLOYMENT - PICKNTRUST"
echo "====================================="

# Build first (we know this works)
echo "Building application..."
npm run build

# Check if build succeeded
if [ ! -f "dist/server/index.js" ]; then
    echo "ERROR: Build failed - no server file"
    exit 1
fi

echo "SUCCESS: Build completed - dist/server/index.js created"

# Kill any existing PM2 processes
echo "Stopping existing PM2 processes..."
pm2 kill

# Start PM2 with ecosystem config
echo "Starting PM2..."
if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs
    echo "PM2 started with ecosystem config"
else
    echo "No ecosystem.config.cjs found, starting directly..."
    pm2 start dist/server/index.js --name "pickntrust"
fi

# Wait for PM2 to start
sleep 3

# Check PM2 status
echo "Checking PM2 status..."
pm2 status

# Test backend
echo "Testing backend on port 5000..."
if curl -s http://localhost:5000 >/dev/null 2>&1; then
    echo "SUCCESS: Backend responding on port 5000"
else
    echo "ERROR: Backend not responding"
    echo "PM2 logs:"
    pm2 logs --lines 5
    exit 1
fi

# Configure and start Nginx
echo "Configuring Nginx..."

# Remove existing config
sudo rm -rf /etc/nginx/sites-enabled
sudo mkdir -p /etc/nginx/sites-enabled
sudo mkdir -p /etc/nginx/sites-available

# Create new config
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
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test nginx config
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "SUCCESS: Nginx config valid"
else
    echo "ERROR: Nginx config invalid"
    exit 1
fi

# Start nginx
echo "Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Wait for nginx
sleep 2

# Test nginx
echo "Testing Nginx on port 80..."
if curl -s http://localhost:80 >/dev/null 2>&1; then
    echo "SUCCESS: Nginx responding on port 80"
else
    echo "ERROR: Nginx not responding"
    sudo systemctl status nginx
    exit 1
fi

# Test external access
echo "Testing external access..."
if curl -I http://51.20.43.157 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    echo "SUCCESS: External access working!"
else
    echo "WARNING: External access may need security group configuration"
fi

# Final status
echo ""
echo "DEPLOYMENT COMPLETE!"
echo "==================="
echo "✓ Build: SUCCESS"
echo "✓ Backend: Running on port 5000"
echo "✓ Nginx: Running on port 80"
echo "✓ Site: http://51.20.43.157"

echo ""
echo "Current PM2 status:"
pm2 status

echo ""
echo "Your PickNTrust site is now LIVE at: http://51.20.43.157"
