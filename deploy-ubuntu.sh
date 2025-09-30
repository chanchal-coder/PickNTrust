#!/bin/bash
# Ubuntu EC2 Deployment Script for PickNTrust
# Optimized for Ubuntu 20.04/22.04

set -e

# Configuration
EC2_IP="51.21.253.229"
KEY_PATH="C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem"
EC2_USER="ubuntu"
GITHUB_REPO="https://github.com/chanchal-coder/PickNTrust.git"
APP_DIR="/home/ubuntu/PickNTrust"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 PickNTrust Ubuntu EC2 Deployment${NC}"
echo -e "${BLUE}Deploying to Ubuntu Server...${NC}"

# Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection...${NC}"
if ssh -i "$KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$EC2_USER@$EC2_IP" exit 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo -e "${RED}Please check: SSH key, EC2 instance status, security groups${NC}"
    exit 1
fi

# Deploy to EC2
echo -e "${YELLOW}📦 Deploying to Ubuntu EC2...${NC}"

ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" bash -s << 'REMOTE_SCRIPT'
set -e

# Colors for remote output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting up Ubuntu environment...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update -y
sudo apt upgrade -y

# Install Node.js 18 (LTS)
echo -e "${YELLOW}📦 Installing Node.js 18...${NC}"
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# Install additional dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt install -y git nginx build-essential

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2...${NC}"
if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 already installed: $(pm2 --version)${NC}"
fi

# Stop any running processes on ports 5000 and 80
echo -e "${YELLOW}🛑 Stopping conflicting processes...${NC}"
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
pm2 delete pickntrust 2>/dev/null || true

# Clone or update repository
echo -e "${YELLOW}📂 Setting up application code...${NC}"
cd /home/ubuntu

if [ -d "PickNTrust" ]; then
    echo -e "${YELLOW}🔄 Updating existing repository...${NC}"
    cd PickNTrust
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone https://github.com/chanchal-coder/PickNTrust.git
    cd PickNTrust
fi

# Install dependencies with clean cache
echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
npm cache clean --force
npm install

# Build application using cross-platform commands
echo -e "${YELLOW}🔨 Building application...${NC}"

# Clean previous builds
rm -rf dist/

# Build client with Vite (cross-platform)
echo -e "${YELLOW}🔨 Building client...${NC}"
npm run build:client

if [ ! -d "dist/public" ]; then
    echo -e "${RED}❌ Client build failed${NC}"
    exit 1
fi

# Build server with esbuild (cross-platform)
echo -e "${YELLOW}🔨 Building server...${NC}"
npm run build:server

if [ ! -f "dist/server/index.js" ]; then
    echo -e "${RED}❌ Server build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Create production environment
echo -e "${YELLOW}⚙️ Configuring environment...${NC}"
cat > .env << 'ENVFILE'
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
INTERNAL_API_KEY=pickntrust_internal_2025

# Telegram Bot Tokens (Optional)
CLICK_PICKS_BOT_TOKEN=
VALUE_PICKS_BOT_TOKEN=
PRIME_PICKS_BOT_TOKEN=
CUE_PICKS_BOT_TOKEN=
DEALSHUB_BOT_TOKEN=
LOOT_BOX_BOT_TOKEN=
GLOBAL_PICKS_BOT_TOKEN=
TRAVEL_PICKS_BOT_TOKEN=

# Telegram Channel IDs (Optional)
CLICK_PICKS_CHANNEL_ID=
VALUE_PICKS_CHANNEL_ID=
PRIME_PICKS_CHANNEL_ID=
CUE_PICKS_CHANNEL_ID=
DEALSHUB_CHANNEL_ID=
LOOT_BOX_CHANNEL_ID=
GLOBAL_PICKS_CHANNEL_ID=
TRAVEL_PICKS_CHANNEL_ID=
ENVFILE

# Set proper permissions (Linux-compatible)
echo -e "${YELLOW}🔐 Setting file permissions...${NC}"
mkdir -p uploads/
chmod 755 uploads/
chmod 644 .env
touch sqlite.db
chmod 644 sqlite.db

# Start application with PM2
echo -e "${YELLOW}🚀 Starting application...${NC}"
pm2 start dist/server/index.js --name "pickntrust"
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep 'sudo' | bash || true

# Configure Nginx
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'NGINXFILE'
server {
    listen 80;
    server_name 51.21.253.229;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Main application
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API routes
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files (if needed)
    location /uploads {
        alias /home/ubuntu/PickNTrust/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXFILE

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and start nginx
echo -e "${YELLOW}🔧 Starting Nginx...${NC}"
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
sleep 5

if pm2 list | grep -q "pickntrust.*online"; then
    echo -e "${GREEN}✅ PM2 process is running${NC}"
else
    echo -e "${RED}❌ PM2 process failed to start${NC}"
    pm2 logs pickntrust --lines 10
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx failed to start${NC}"
    sudo systemctl status nginx
    exit 1
fi

# Test application response
echo -e "${YELLOW}🌐 Testing application...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|302"; then
    echo -e "${GREEN}✅ Application is responding${NC}"
else
    echo -e "${RED}❌ Application is not responding${NC}"
    pm2 logs pickntrust --lines 20
fi

echo -e "${GREEN}🎉 Ubuntu deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "${BLUE}   • Repository: Updated from GitHub${NC}"
echo -e "${BLUE}   • Dependencies: Installed with npm ci${NC}"
echo -e "${BLUE}   • Build: Client (Vite) + Server (esbuild)${NC}"
echo -e "${BLUE}   • Process: Running with PM2${NC}"
echo -e "${BLUE}   • Web Server: Nginx configured${NC}"
echo -e "${BLUE}   • Environment: Production ready${NC}"
echo -e "${GREEN}🌐 Application URL: http://51.21.253.229${NC}"
echo -e "${GREEN}🔑 Admin Panel: http://51.21.253.229/admin${NC}"
echo -e "${GREEN}📱 Credentials: admin / pickntrust2025${NC}"

REMOTE_SCRIPT

echo -e "${GREEN}🎉 Ubuntu EC2 deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Visit: http://51.21.253.229${NC}"
echo -e "${BLUE}🔧 Admin: http://51.21.253.229/admin (admin/pickntrust2025)${NC}"