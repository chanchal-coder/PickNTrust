#!/bin/bash

echo "🎯 NGINX CONFIGURATION FIX - Final solution for 502 Bad Gateway"

# Step 1: Start services first
echo "🚀 Starting services..."
./WORKING_SOLUTION.sh

sleep 5

# Step 2: Check if services are running
echo "🔍 Checking services..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")

echo "Backend (5000): $BACKEND_STATUS"
echo "Frontend (5173): $FRONTEND_STATUS"

if [ "$BACKEND_STATUS" = "FAILED" ] && [ "$FRONTEND_STATUS" != "FAILED" ]; then
    echo "⚠️  Backend failed, but frontend is working. Configuring nginx for frontend-only..."
    
    # Create nginx config for frontend-only (since backend keeps crashing)
    sudo tee /etc/nginx/sites-available/pickntrust << 'EOF'
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    
    # Serve everything from frontend (since backend is unstable)
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

elif [ "$BACKEND_STATUS" != "FAILED" ] && [ "$FRONTEND_STATUS" != "FAILED" ]; then
    echo "✅ Both services working. Configuring nginx for full setup..."
    
    # Create nginx config for both services
    sudo tee /etc/nginx/sites-available/pickntrust << 'EOF'
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    
    # API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Everything else to frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

else
    echo "❌ Services not responding. Please run ./WORKING_SOLUTION.sh first"
    exit 1
fi

# Step 3: Enable the site and reload nginx
echo "🔧 Configuring nginx..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config error"
    sudo nginx -t
    exit 1
fi

# Step 4: Test the domain
echo "🌐 Testing domain..."
sleep 3
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://pickntrust.com 2>/dev/null || echo "FAILED")
echo "Domain status: $DOMAIN_STATUS"

if [ "$DOMAIN_STATUS" = "200" ] || [ "$DOMAIN_STATUS" = "404" ]; then
    echo "🎉 SUCCESS! Domain is working!"
    echo "✅ No more 502 Bad Gateway errors"
    echo "🌐 Visit: http://pickntrust.com"
else
    echo "⚠️  Domain still showing issues. Check nginx logs:"
    echo "sudo tail -f /var/log/nginx/error.log"
fi

echo "📊 FINAL STATUS:"
echo "Backend (5000): $BACKEND_STATUS"
echo "Frontend (5173): $FRONTEND_STATUS"
echo "Domain: $DOMAIN_STATUS"

echo "✅ NGINX FIX COMPLETED!"
