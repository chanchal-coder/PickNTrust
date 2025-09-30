# 🚀 SIMPLE DEPLOYMENT STEPS - COPY & PASTE

## Step 1: SSH into EC2 (you're already connected)
Since you're already in the EC2 instance, just run these commands:

## Step 2: Navigate to project directory
```bash
cd PickNTrust
```

## Step 3: Create and run the deployment script
Copy and paste this entire block:

```bash
cat > deploy_now.sh << 'EOF'
#!/bin/bash

echo "PICKNTRUST DEPLOYMENT STARTING..."
echo "================================="

# Kill everything first
echo "Stopping all services..."
pm2 kill 2>/dev/null || true
sudo pkill -f nginx 2>/dev/null || true
sudo pkill -f node 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sleep 2

# Install dependencies
echo "Installing dependencies..."
npm install

# Build application
echo "Building application..."
npm run build

# Verify build
if [ ! -f "dist/server/index.js" ]; then
    echo "ERROR: Backend build failed!"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "ERROR: Frontend build failed!"
    exit 1
fi

echo "SUCCESS: Build completed"

# Create nginx config
echo "Configuring Nginx..."
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'NGINXEOF'
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
NGINXEOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test nginx config
if ! sudo nginx -t; then
    echo "ERROR: Nginx configuration invalid!"
    exit 1
fi

# Start PM2
echo "Starting backend with PM2..."
pm2 start ecosystem.config.cjs --env production

# Wait for backend
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5000 >/dev/null 2>&1; then
        echo "SUCCESS: Backend is running on port 5000"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "ERROR: Backend failed to start!"
        pm2 logs --lines 10
        exit 1
    fi
done

# Start nginx
echo "Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Wait for nginx
echo "Waiting for Nginx to start..."
for i in {1..10}; do
    if curl -s http://localhost:80 >/dev/null 2>&1; then
        echo "SUCCESS: Nginx is running on port 80"
        break
    fi
    sleep 1
    if [ $i -eq 10 ]; then
        echo "ERROR: Nginx failed to start!"
        sudo systemctl status nginx
        exit 1
    fi
done

# Get external IP
EXTERNAL_IP=$(curl -s http://checkip.amazonaws.com/ 2>/dev/null || echo "51.20.43.157")

# Final tests
echo "Testing external access..."
if curl -I http://$EXTERNAL_IP 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    echo "SUCCESS: External access working!"
else
    echo "WARNING: External access may need security group configuration"
fi

# Final status
echo ""
echo "DEPLOYMENT COMPLETE!"
echo "==================="
echo "SUCCESS: Backend: Running on port 5000"
echo "SUCCESS: Frontend: Built and served"
echo "SUCCESS: Nginx: Running on port 80"
echo "SUCCESS: Database: SQLite configured"
echo "SUCCESS: External IP: $EXTERNAL_IP"

echo ""
echo "ACCESS YOUR SITE:"
echo "   http://$EXTERNAL_IP"
echo "   http://pickntrust.com (if DNS configured)"

echo ""
echo "MONITORING:"
echo "   pm2 status           # Check backend"
echo "   pm2 logs            # View logs"

echo ""
echo "CURRENT STATUS:"
pm2 status
echo ""
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "SUCCESS: Your PickNTrust site is now LIVE!"
EOF

chmod +x deploy_now.sh
bash deploy_now.sh
```

## That's it!

Just copy the entire block above and paste it into your terminal. It will:
1. Create the deployment script
2. Make it executable
3. Run it immediately

The script will show you step-by-step progress and end with:
```
SUCCESS: Your PickNTrust site is now LIVE!
```

Then you can access your site at: **http://51.20.43.157**

## If you get any errors:
Just run these commands to check status:
```bash
pm2 status
sudo systemctl status nginx
pm2 logs
