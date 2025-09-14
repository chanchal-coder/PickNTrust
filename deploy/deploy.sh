#!/bin/bash
# Clean One-Command Deployment Script for PickNTrust
# Run this on your local machine to deploy to EC2 (Amazon Linux 2023)

set -e

# Configuration
EC2_IP="51.20.43.157"
KEY_PATH="C:/AWSKeys/picktrust-key.pem"
EC2_USER="ec2-user"
GITHUB_REPO="https://github.com/chanchal-coder/PickNTrust.git"
DOMAIN="51.20.43.157"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 PickNTrust One-Command Deployment${NC}"
echo -e "${BLUE}Starting deployment to EC2 (Amazon Linux 2023)...${NC}"

# Step 1: Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection to EC2...${NC}"
if ssh -i "$KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$EC2_USER@$EC2_IP" exit 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed. Please check your SSH key, EC2 instance, and security group.${NC}"
    exit 1
fi

# Step 2: Run remote deployment commands on EC2
echo -e "${YELLOW}⚙️ Running deployment commands on EC2...${NC}"

ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" bash -s << 'REMOTE_SCRIPT'
set -e

echo "📦 Updating system packages..."
sudo dnf update -y

echo "📦 Installing dependencies..."
# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs git nginx

# Install PM2 globally
sudo npm install -g pm2

echo "📂 Cloning PickNTrust repository..."
rm -rf PickNTrust
git clone https://github.com/chanchal-coder/PickNTrust.git PickNTrust
cd PickNTrust

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "⚙️ Creating environment file..."
cat > .env << 'ENVFILE'
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025

# Telegram Bot Tokens (Optional - empty to disable bots)
CLICK_PICKS_BOT_TOKEN=
VALUE_PICKS_BOT_TOKEN=
PRIME_PICKS_BOT_TOKEN=
CUE_PICKS_BOT_TOKEN=
DEALSHUB_BOT_TOKEN=
LOOT_BOX_BOT_TOKEN=
GLOBAL_PICKS_BOT_TOKEN=
TRAVEL_PICKS_BOT_TOKEN=

# Telegram Channel IDs (Optional - empty to disable)
CLICK_PICKS_CHANNEL_ID=
VALUE_PICKS_CHANNEL_ID=
PRIME_PICKS_CHANNEL_ID=
CUE_PICKS_CHANNEL_ID=
DEALSHUB_CHANNEL_ID=
LOOT_BOX_CHANNEL_ID=
GLOBAL_PICKS_CHANNEL_ID=
TRAVEL_PICKS_CHANNEL_ID=

# Internal API Key
INTERNAL_API_KEY=pickntrust_internal_2025
ENVFILE

echo "📋 Initializing database with sample data..."
# Database will be created automatically by the application
# Sample data will be inserted on first run

echo "🔄 Managing PM2 process..."
pm2 delete pickntrust 2>/dev/null || true
pm2 start npm --name "pickntrust" -- start
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user | grep 'sudo' | bash || true

echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'NGINXFILE'
server {
    listen 80;
    server_name 51.20.43.157;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
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
NGINXFILE

# Remove default nginx config if it exists
sudo rm -f /etc/nginx/conf.d/default.conf

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Deployment completed on EC2!"
echo "🌐 Your app should be live at: http://51.20.43.157"
REMOTE_SCRIPT

echo -e "${GREEN}🎉 Full deployment completed! Visit http://51.20.43.157 to see your app.${NC}"
echo -e "${GREEN}🔑 Admin panel: http://51.20.43.157/admin (admin/pickntrust2025)${NC}"
