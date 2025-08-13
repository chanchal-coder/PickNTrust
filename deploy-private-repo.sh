#!/bin/bash
# Private Repository Deployment Script for PickNTrust
# Works with private GitHub repositories by deploying from local files

set -e

# Configuration
EC2_IP="51.20.43.157"
KEY_PATH="./picktrust-key.pem"
EC2_USER="ubuntu"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting PickNTrust Private Repository Deployment${NC}"
echo -e "${YELLOW}📍 Target: $EC2_IP${NC}"

# Step 1: Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection...${NC}"
if ssh -i "$KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$EC2_USER@$EC2_IP" exit 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed. Please check:${NC}"
    echo -e "${RED}   - EC2 instance is running${NC}"
    echo -e "${RED}   - Security group allows SSH (port 22)${NC}"
    echo -e "${RED}   - SSH key path is correct: $KEY_PATH${NC}"
    exit 1
fi

# Step 2: Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf pickntrust-app.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=attached_assets \
  --exclude=uploads \
  --exclude=*.log \
  --exclude=dev.log \
  --exclude=server-output.log \
  .

if [ -f "pickntrust-app.tar.gz" ]; then
    echo -e "${GREEN}✅ Deployment package created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create deployment package${NC}"
    exit 1
fi

# Step 3: Upload to EC2
echo -e "${YELLOW}📤 Uploading to EC2...${NC}"
if scp -i "$KEY_PATH" pickntrust-app.tar.gz "$EC2_USER@$EC2_IP:/home/ubuntu/"; then
    echo -e "${GREEN}✅ Upload successful${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

# Step 4: Deploy on EC2
echo -e "${YELLOW}🔧 Installing and configuring on EC2...${NC}"
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'EOF'
set -e

echo "🔄 Starting deployment on EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other dependencies
echo "📦 Installing additional dependencies..."
sudo apt-get install -y git nginx
sudo npm install -g pm2

# Extract and setup application
echo "📂 Setting up application..."
cd /home/ubuntu
rm -rf PickNTrust
mkdir -p PickNTrust
tar -xzf pickntrust-app.tar.gz -C PickNTrust
cd PickNTrust

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
ENVEOF

# Stop existing PM2 process if running
echo "🔄 Managing PM2 processes..."
pm2 delete pickntrust 2>/dev/null || true

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start npm --name "pickntrust" -- start
pm2 save

# Setup PM2 startup
echo "⚙️ Configuring PM2 startup..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep 'sudo' | bash || true

# Configure Nginx
echo "🌐 Configuring Nginx..."
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

    location /api {
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

    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Enable site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "✅ EC2 deployment completed!"
echo "🌐 Your app should be live at: http://51.20.43.157"
echo "👨‍💼 Admin panel: http://51.20.43.157/admin"
EOF

# Step 5: Test deployment
echo -e "${YELLOW}🧪 Testing deployment...${NC}"
sleep 5

if curl -s -o /dev/null -w "%{http_code}" "http://$EC2_IP" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Application is responding!${NC}"
else
    echo -e "${YELLOW}⚠️ Application may still be starting up...${NC}"
fi

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up local files...${NC}"
rm -f pickntrust-app.tar.gz

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━The reason your GitHub repository is marked as private is that its visibility setting is configured to restrict access only to authorized users. This is a security feature to protect your code and sensitive information from public access.

To deploy from a private repository, you have these options:

1. Use a GitHub Personal Access Token (PAT) in your deployment scripts to authenticate and clone the private repo.
2. Deploy directly from your local files by packaging and uploading them to your AWS EC2 instance.
3. Temporarily make the repository public during deployment and revert it back to private afterward.

I have created a detailed guide named `PRIVATE_REPO_DEPLOYMENT_SOLUTION.md` in your project directory that explains these options and provides a deployment script tailored for private repositories.

Would you like me to help you proceed with deploying using the local files approach or assist with setting up authentication for private repo cloning?
