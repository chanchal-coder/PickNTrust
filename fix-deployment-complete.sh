#!/bin/bash
# Complete deployment fix script for PickNTrust

set -e

echo "🔧 Starting comprehensive deployment fix..."

# Step 1: Check AWS Security Group (this needs to be done from AWS Console or CLI)
echo "⚠️  IMPORTANT: Ensure AWS Security Group allows inbound traffic on ports 80, 443, and 22"
echo "   - Go to AWS EC2 Console > Security Groups"
echo "   - Find security group for instance 51.21.202.172"
echo "   - Add inbound rules: HTTP (80), HTTPS (443), SSH (22) from 0.0.0.0/0"

# Step 2: Kill all existing processes
echo "🛑 Stopping all existing services..."
sudo pkill -f node || true
sudo pkill -f python3 || true
pm2 delete all || true
sudo systemctl stop nginx || true

# Step 3: Configure Ubuntu firewall properly
echo "🔥 Configuring Ubuntu firewall..."
sudo ufw --force reset
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable
sudo ufw status

# Step 4: Install and configure Nginx properly
echo "🌐 Setting up Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /uploads/ {
        alias /opt/pickntrust/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /assets/ {
        alias /opt/pickntrust/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable the site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# Step 5: Start the Node.js application
echo "🚀 Starting PickNTrust application..."
cd /opt/pickntrust

# Ensure environment file exists
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
DOMAIN=www.pickntrust.com
FRONTEND_URL=https://www.pickntrust.com
ENVEOF

# Start with PM2
npm install -g pm2
pm2 start npm --name "pickntrust-app" -- start
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Step 6: Test everything
echo "🧪 Testing deployment..."
sleep 10

# Test local connections
echo "Testing localhost:5000..."
curl -I http://localhost:5000 || echo "❌ App not responding on port 5000"

echo "Testing localhost:80..."
curl -I http://localhost || echo "❌ Nginx not responding on port 80"

# Check services
echo "📊 Service Status:"
pm2 status
sudo systemctl status nginx --no-pager -l

# Check ports
echo "📡 Open Ports:"
sudo netstat -tulpn | grep -E ':(80|5000|443) '

echo "✅ Deployment fix completed!"
echo "🌐 If still not accessible externally, check AWS Security Group settings"
echo "   AWS Console > EC2 > Security Groups > Add Inbound Rules:"
echo "   - Type: HTTP, Port: 80, Source: 0.0.0.0/0"
echo "   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0"
echo "   - Type: SSH, Port: 22, Source: 0.0.0.0/0"
