#!/bin/bash

# Fix 502 Bad Gateway - Nginx Configuration Script
# This script fixes nginx configuration for the correct directory structure

echo "🔧 Fixing 502 Bad Gateway - Nginx Configuration"
echo "================================================"

# Stop nginx to prevent conflicts
echo "⏹️  Stopping nginx..."
sudo systemctl stop nginx 2>/dev/null || true

# Remove old configurations
echo "🗑️  Removing old nginx configurations..."
sudo rm -f /etc/nginx/sites-enabled/pickntrust
sudo rm -f /etc/nginx/sites-available/pickntrust
sudo rm -f /etc/nginx/conf.d/pickntrust.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Create correct nginx configuration
echo "📝 Creating new nginx configuration..."
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    # Set correct document root - adjust path based on deployment
    root /home/ec2-user/PickNTrust/dist/public;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Handle static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @backend;
    }
    
    # API routes - proxy to backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Admin routes - proxy to backend
    location /admin {
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
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # All other routes - try static files first, then proxy to backend
    location / {
        try_files $uri $uri/ @backend;
    }
    
    # Backend fallback for SPA routing
    location @backend {
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
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Hide nginx version
    server_tokens off;
}
EOF

# Enable the site
echo "🔗 Enabling nginx site..."
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration is invalid!"
    sudo nginx -t
    exit 1
fi

# Check if backend is running
echo "🔍 Checking backend server status..."
if curl -s http://127.0.0.1:5000/health > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 5000"
else
    echo "⚠️  Backend server is not responding on port 5000"
    echo "   Starting backend server..."
    
    # Try to start the backend
    cd /home/ec2-user/PickNTrust
    
    if [ -f "dist/server/index.js" ]; then
        echo "   Found built server, starting with PM2..."
        pm2 stop pickntrust-app 2>/dev/null || true
        pm2 start dist/server/index.js --name pickntrust-app
        sleep 3
    else
        echo "   ❌ Built server not found at dist/server/index.js"
        echo "   Please run: npm run build"
        exit 1
    fi
fi

# Start nginx
echo "🚀 Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Wait a moment for nginx to start
sleep 2

# Test the configuration
echo "🧪 Testing nginx on port 80..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ Nginx is responding on port 80"
else
    echo "⚠️  Nginx may not be responding correctly"
fi

# Show status
echo ""
echo "📊 Service Status:"
echo "================="
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l | head -10
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "🎉 Nginx configuration updated!"
echo ""
echo "📝 Next steps:"
echo "   1. Test your website: http://YOUR_SERVER_IP"
echo "   2. Check logs if issues persist:"
echo "      - Nginx: sudo tail -f /var/log/nginx/error.log"
echo "      - Backend: pm2 logs pickntrust-app"
echo "   3. If still getting 502, restart both services:"
echo "      - pm2 restart pickntrust-app"
echo "      - sudo systemctl restart nginx"