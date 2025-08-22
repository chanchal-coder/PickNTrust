#!/bin/bash

echo "🎯 FINAL COMPLETE FIX - All-in-one solution"

# Step 1: Kill all processes and clear ports
echo "🧹 Cleaning up processes..."
sudo pkill -9 -f "node" 2>/dev/null || true
sudo pkill -9 -f "tsx" 2>/dev/null || true
sudo pkill -9 -f "vite" 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
sleep 3

# Step 2: Start backend
echo "🚀 Starting backend on port 5000..."
cd /home/ec2-user/PickNTrust
NODE_ENV=development nohup npx tsx server/index.ts > backend-final-complete.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 8

# Test backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")
echo "Backend status: $BACKEND_STATUS"

# Step 3: Start frontend
echo "🚀 Starting frontend on port 5173..."
cd /home/ec2-user/PickNTrust/client
nohup npx vite --host 0.0.0.0 --port 5173 > ../frontend-final-complete.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..
sleep 8

# Test frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")
echo "Frontend status: $FRONTEND_STATUS"

# Step 4: Create nginx directories if they don't exist
echo "🔧 Setting up nginx directories..."
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Step 5: Configure nginx based on what's working
if [ "$FRONTEND_STATUS" != "FAILED" ]; then
    echo "✅ Frontend is working. Configuring nginx..."
    
    # Create nginx config
    sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    
    # Serve everything from frontend (most reliable)
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
EOF

    # Enable the site
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo rm -f /etc/nginx/sites-enabled/pickntrust
    sudo ln -s /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
    
    # Test and reload nginx
    if sudo nginx -t; then
        echo "✅ Nginx config is valid"
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded"
    else
        echo "❌ Nginx config error"
        sudo nginx -t
    fi
    
else
    echo "❌ Frontend not working, skipping nginx config"
fi

# Step 6: Test everything
echo "🔍 Final testing..."
sleep 3

echo "📊 FINAL STATUS:"
echo "Backend (5000): $BACKEND_STATUS"
echo "Frontend (5173): $FRONTEND_STATUS"

# Test domain
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://pickntrust.com 2>/dev/null || echo "FAILED")
echo "Domain: $DOMAIN_STATUS"

if [ "$DOMAIN_STATUS" = "200" ] || [ "$DOMAIN_STATUS" = "301" ] || [ "$DOMAIN_STATUS" = "302" ]; then
    echo "🎉 SUCCESS! Domain is responding!"
    echo "✅ No more 502 Bad Gateway errors"
else
    echo "⚠️  Domain issues. Nginx error logs:"
    sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No nginx logs found"
fi

echo "📝 Service logs:"
echo "Backend: tail -f backend-final-complete.log"
echo "Frontend: tail -f frontend-final-complete.log"

echo "🔄 Services running with PIDs:"
echo "Backend: $BACKEND_PID"
echo "Frontend: $FRONTEND_PID"

echo "✅ FINAL COMPLETE FIX FINISHED!"
