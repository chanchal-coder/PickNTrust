#!/bin/bash

echo "FINAL DEPLOYMENT FIX - ADDRESSING REMAINING ISSUES"
echo "=================================================="

# Fix nginx sites-enabled issue
echo "Fixing Nginx configuration..."
sudo rm -rf /etc/nginx/sites-enabled
sudo mkdir -p /etc/nginx/sites-enabled
sudo rm -f /etc/nginx/sites-enabled/default

# Create proper nginx config
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    client_max_body_size 50M;
    
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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test nginx config
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "SUCCESS: Nginx configuration is valid"
else
    echo "ERROR: Nginx configuration failed"
    exit 1
fi

# Restart services
echo "Restarting services..."
pm2 restart all
sudo systemctl restart nginx

# Wait and test
sleep 3

echo "Testing connectivity..."
if curl -s http://localhost:5000 > /dev/null; then
    echo "SUCCESS: Backend responding on port 5000"
else
    echo "ERROR: Backend not responding"
fi

if curl -s http://localhost:80 > /dev/null; then
    echo "SUCCESS: Nginx responding on port 80"
else
    echo "ERROR: Nginx not responding"
fi

# Test external access
EXTERNAL_IP="51.20.43.157"
echo "Testing external access to $EXTERNAL_IP..."
if curl -I http://$EXTERNAL_IP 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    echo "SUCCESS: External access working!"
else
    echo "WARNING: External access may have issues"
fi

echo ""
echo "FINAL STATUS:"
echo "============="
pm2 status
echo ""
sudo systemctl status nginx --no-pager | head -3

echo ""
echo "SUCCESS: Your site should now be accessible at http://51.20.43.157"
echo "If you still have issues, run: pm2 logs"
