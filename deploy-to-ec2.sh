#!/bin/bash

# PickNTrust AWS EC2 Deployment Script
# Usage: ./deploy-to-ec2.sh

set -e

# Configuration
EC2_IP="51.20.43.157"
KEY_PATH="C:/AWSKeys/picktrust-key.pem"
EC2_USER="ubuntu"
APP_NAME="pickntrust"
GITHUB_REPO="https://github.com/chanchal-coder/PickNTrust.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting PickNTrust deployment to AWS EC2${NC}"
echo -e "${BLUE}Target: ${EC2_USER}@${EC2_IP}${NC}"

# Function to run commands on EC2
run_on_ec2() {
    ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$1"
}

# Function to copy files to EC2
copy_to_ec2() {
    scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$1" "$EC2_USER@$EC2_IP:$2"
}

# Step 1: Test SSH connection
echo -e "${YELLOW}Step 1: Testing SSH connection...${NC}"
if run_on_ec2 "echo 'SSH connection successful'"; then
    echo -e "${GREEN}✅ SSH connection established${NC}"
else
    echo -e "${RED}❌ SSH connection failed. Please check your key file and EC2 instance.${NC}"
    exit 1
fi

# Step 2: Update system and install dependencies
echo -e "${YELLOW}Step 2: Installing system dependencies...${NC}"
run_on_ec2 "
    sudo apt update && sudo apt upgrade -y
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs git nginx
    sudo npm install -g pm2
    echo 'Dependencies installed successfully'
"

# Step 3: Clone or update repository
echo -e "${YELLOW}Step 3: Setting up application code...${NC}"
run_on_ec2 "
    cd /home/ubuntu
    if [ -d 'PickNTrust' ]; then
        echo 'Repository exists, updating...'
        cd PickNTrust
        git pull origin main
    else
        echo 'Cloning repository...'
        git clone $GITHUB_REPO
        cd PickNTrust
    fi
    
    # Install dependencies
    npm install
    
    # Build application
    npm run build
    
    echo 'Application code ready'
"

# Step 4: Create environment file
echo -e "${YELLOW}Step 4: Configuring environment...${NC}"
run_on_ec2 "
    cd /home/ubuntu/PickNTrust
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
EOF
    echo 'Environment configured'
"

# Step 5: Configure and start PM2
echo -e "${YELLOW}Step 5: Starting application with PM2...${NC}"
run_on_ec2 "
    cd /home/ubuntu/PickNTrust
    
    # Stop existing PM2 process if running
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start application
    pm2 start npm --name '$APP_NAME' -- start
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep 'sudo' | bash || true
    
    echo 'Application started with PM2'
"

# Step 6: Configure Nginx
echo -e "${YELLOW}Step 6: Configuring Nginx...${NC}"
run_on_ec2 "
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << 'EOF'
server {
    listen 80;
    server_name $EC2_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable site and restart Nginx
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    echo 'Nginx configured and restarted'
"

# Step 7: Test deployment
echo -e "${YELLOW}Step 7: Testing deployment...${NC}"
sleep 5  # Wait for services to start

# Test local connection on EC2
run_on_ec2 "
    echo 'Testing local application...'
    curl -f http://localhost:3000 > /dev/null && echo 'Local app: ✅ Working' || echo 'Local app: ❌ Failed'
    
    echo 'Testing Nginx proxy...'
    curl -f http://localhost > /dev/null && echo 'Nginx proxy: ✅ Working' || echo 'Nginx proxy: ❌ Failed'
    
    echo 'PM2 Status:'
    pm2 status
    
    echo 'Nginx Status:'
    sudo systemctl status nginx --no-pager -l
"

# Final status
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${GREEN}📱 Your application is now live at:${NC}"
echo -e "${BLUE}   Main Website: http://${EC2_IP}${NC}"
echo -e "${BLUE}   Admin Panel:  http://${EC2_IP}/admin${NC}"
echo -e "${BLUE}   API Endpoints: http://${EC2_IP}/api/*${NC}"
echo ""
echo -e "${GREEN}🔑 Admin Credentials:${NC}"
echo -e "${BLUE}   Username: admin${NC}"
echo -e "${BLUE}   Password: pickntrust2025${NC}"
echo ""
echo -e "${YELLOW}📋 To manage your application:${NC}"
echo -e "${BLUE}   SSH: ssh -i \"$KEY_PATH\" $EC2_USER@$EC2_IP${NC}"
echo -e "${BLUE}   PM2 Status: pm2 status${NC}"
echo -e "${BLUE}   PM2 Logs: pm2 logs $APP_NAME${NC}"
echo -e "${BLUE}   Restart App: pm2 restart $APP_NAME${NC}"
echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
