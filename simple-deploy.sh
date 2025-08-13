#!/bin/bash
# Simple deployment script for PickNTrust

set -e

echo "🚀 Starting PickNTrust deployment..."

# Configuration
EC2_IP="51.20.43.157"
KEY_PATH="./picktrust-key.pem"
EC2_USER="ubuntu"

# Test SSH connection
echo "Testing SSH connection..."
ssh -i "$KEY_PATH" -o ConnectTimeout=10 "$EC2_USER@$EC2_IP" "echo 'SSH connection successful'"

# Create deployment package
echo "Creating deployment package..."
tar -czf pickntrust-app.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=attached_assets \
  --exclude=uploads \
  --exclude=*.log \
  .

# Upload to EC2
echo "Uploading to EC2..."
scp -i "$KEY_PATH" pickntrust-app.tar.gz "$EC2_USER@$EC2_IP:/home/ubuntu/"

# Deploy on EC2
echo "Deploying on EC2..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'EOF'
echo "Starting deployment on EC2..."

# Update system
sudo apt update -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
sudo npm install -g pm2

# Setup application
cd /home/ubuntu
rm -rf PickNTrust
mkdir -p PickNTrust
tar -xzf pickntrust-app.tar.gz -C PickNTrust
cd PickNTrust

# Install dependencies and build
npm install
npm run build

# Create environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
ENVEOF

# Start with PM2
pm2 delete pickntrust 2>/dev/null || true
pm2 start npm --name "pickntrust" -- start
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep 'sudo' | bash || true

# Configure Nginx
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name 51.20.43.157;

    location / {
        proxy_pass http://localhost:3000;
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

sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment completed!"
EOF

# Test deployment
echo "Testing deployment..."
sleep 5
curl -I "http://$EC2_IP" || echo "Site may still be starting up..."

# Cleanup
rm -f pickntrust-app.tar.gz

echo "🎉 Deployment script completed!"
echo "Your app should be available at: http://$EC2_IP"
