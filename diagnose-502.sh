#!/bin/bash

# Quick 502 Diagnosis Script
# This script quickly diagnoses common 502 Bad Gateway issues

echo "🔍 Quick 502 Bad Gateway Diagnosis"
echo "=================================="

# Check if backend is running
echo "1️⃣ Checking backend processes..."
pm2 status

echo ""
echo "2️⃣ Checking port 5000..."
if netstat -tlnp | grep :5000; then
    echo "✅ Port 5000 is in use"
else
    echo "❌ Port 5000 is not in use - this is the problem!"
fi

echo ""
echo "3️⃣ Testing backend directly..."
if curl -s http://127.0.0.1:5000 > /dev/null 2>&1; then
    echo "✅ Backend responds on 127.0.0.1:5000"
else
    echo "❌ Backend does not respond on 127.0.0.1:5000"
fi

echo ""
echo "4️⃣ Checking nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
fi

echo ""
echo "5️⃣ Recent nginx errors..."
sudo tail -5 /var/log/nginx/error.log

echo ""
echo "6️⃣ Recent PM2 logs..."
pm2 logs --lines 5

echo ""
echo "🔧 Quick Fix Commands:"
echo "====================="
echo "# Restart backend:"
echo "pm2 restart all"
echo ""
echo "# Restart nginx:"
echo "sudo systemctl restart nginx"
echo ""
echo "# Check if backend is on correct port:"
echo "curl http://127.0.0.1:5000"
echo ""
echo "# Full fix script:"
echo "./fix-backend-port.sh"