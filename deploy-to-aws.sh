#!/bin/bash

# PickNTrust AWS EC2 Deployment Script
# This script fixes build issues and deploys the application to AWS EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 PickNTrust AWS EC2 Deployment Script${NC}"
echo -e "${YELLOW}This script will fix build issues and deploy to AWS EC2${NC}"

# Step 1: Check prerequisites
echo -e "\n${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo -e "${YELLOW}Install AWS CLI: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 2: Fix build issues
echo -e "\n${YELLOW}Step 2: Fixing build issues...${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please check the errors above.${NC}"
    exit 1
fi

# Step 3: Create environment file
echo -e "\n${YELLOW}Step 3: Creating environment configuration...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env file from .env.example${NC}"
    echo -e "${YELLOW}⚠️  Please update the .env file with your actual values${NC}"
fi

# Step 4: AWS EC2 Deployment Configuration
echo -e "\n${YELLOW}Step 4: AWS EC2 Deployment Configuration...${NC}"

# Configuration variables
PROJECT_NAME="pickntrust"
AWS_REGION="us-east-1"
INSTANCE_TYPE="t3.small"
KEY_NAME="pickntrust-key"
SECURITY_GROUP_NAME="pickntrust-sg"

# Step 5: Create EC2 Key Pair
echo -e "\n${YELLOW}Step 5: Creating EC2 Key Pair...${NC}"
if aws ec2 describe-key-pairs --key-name $KEY_NAME &> /dev/null; then
    echo -e "${YELLOW}Key pair already exists, skipping creation...${NC}"
else
    aws ec2 create-key-pair \
      --key-name $KEY_NAME \
      --key-type rsa \
      --key-format pem \
      --query "KeyMaterial" \
      --output text > $KEY_NAME.pem
    chmod 400 $KEY_NAME.pem
    echo -e "${GREEN}✅ Key pair created: $KEY_NAME.pem${NC}"
fi

# Step 6: Create Security Group
echo -e "\n${YELLOW}Step 6: Creating Security Group...${NC}"
if aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME &> /dev/null; then
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME --query "SecurityGroups[0].GroupId" --output text)
    echo -e "${YELLOW}Security group already exists: $SECURITY_GROUP_ID${NC}"
else
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
      --group-name $SECURITY_GROUP_NAME \
      --description "Security group for PickNTrust" \
      --query "GroupId" \
      --output text)
    
    # Add inbound rules
    aws ec2 authorize-security-group-ingress \
      --group-id $SECURITY_GROUP_ID \
      --protocol tcp \
      --port 22 \
      --cidr 0.0.0.0/0
    
    aws ec2 authorize-security-group-ingress \
      --group-id $SECURITY_GROUP_ID \
      --protocol tcp \
      --port 80 \
      --cidr 0.0.0.0/0
    
    aws ec2 authorize-security-group-ingress \
      --group-id $SECURITY_GROUP_ID \
      --protocol tcp \
      --port 443 \
      --cidr 0.0.0.0/0
    
    aws ec2 authorize-security-group-ingress \
      --group-id $SECURITY_GROUP_ID \
      --protocol tcp \
      --port 5000 \
      --cidr 0.0.0.0/0
    
    echo -e "${GREEN}✅ Security group created: $SECURITY_GROUP_ID${NC}"
fi

# Step 7: Create user data script
echo -e "\n${YELLOW}Step 7: Creating EC2 user data script...${NC}"
cat > user-data.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting PickNTrust setup on EC2..."

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git
apt-get install -y git

# Install Nginx
apt-get install -y nginx

# Create application directory
mkdir -p /opt/pickntrust
cd /opt/pickntrust

echo "✅ EC2 setup complete!"
EOF

# Step 8: Launch EC2 Instance
echo -e "\n${YELLOW}Step 8: Launching EC2 Instance...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0c02b5597204e1e5d \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --security-group-ids $SECURITY_GROUP_ID \
  --user-data file://user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=PickNTrust-App}]" \
  --query "Instances[0].InstanceId" \
  --output text)

echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"

# Step 9: Wait for instance to be running
echo -e "\n${YELLOW}Step 9: Waiting for instance to be running...${NC}"
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

echo -e "${GREEN}✅ Instance is running at: $PUBLIC_IP${NC}"

# Step 10: Create deployment package
echo -e "\n${YELLOW}Step 10: Creating deployment package...${NC}"

# Create a deployment archive
tar -czf pickntrust-app.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=*.log \
  --exclude=user-data.sh \
  --exclude=pickntrust-key.pem \
  --exclude=pickntrust-app.tar.gz \
  .

echo -e "${GREEN}✅ Deployment package created: pickntrust-app.tar.gz${NC}"

# Step 11: Create deployment script for EC2
echo -e "\n${YELLOW}Step 11: Creating EC2 deployment script...${NC}"
cat > deploy-on-ec2.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying PickNTrust application on EC2..."

# COMPLETE CLEANUP OF PREVIOUS DEPLOYMENT
echo "🧹 Cleaning up previous deployment..."

# Stop and delete all PM2 processes
pm2 stop all || true
pm2 delete all || true
pm2 kill || true

# Stop Nginx
sudo systemctl stop nginx || true

# Remove previous application directory completely
sudo rm -rf /opt/pickntrust
sudo mkdir -p /opt/pickntrust
sudo chown -R ubuntu:ubuntu /opt/pickntrust

# Remove previous Nginx configuration
sudo rm -f /etc/nginx/sites-enabled/pickntrust
sudo rm -f /etc/nginx/sites-available/pickntrust
sudo rm -f /etc/nginx/sites-enabled/default

# Clear any previous SSL certificates (if any)
sudo rm -rf /etc/letsencrypt/live/www.pickntrust.com || true
sudo rm -rf /etc/letsencrypt/live/pickntrust.com || true

# Clear PM2 startup scripts
pm2 unstartup || true

# Kill any remaining Node.js processes
sudo pkill -f node || true
sudo pkill -f npm || true

# Clear npm cache
npm cache clean --force || true

# Clear any previous logs
sudo rm -rf /var/log/nginx/pickntrust* || true
sudo rm -rf ~/.pm2/logs/* || true

echo "✅ Previous deployment cleaned up completely"

# Navigate to application directory
cd /opt/pickntrust

# Extract application files
tar -xzf pickntrust-app.tar.gz

# Install dependencies
npm install --production

# Create environment file
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

# Build the application (if needed)
npm run build

# Stop existing PM2 processes
pm2 stop all || true
pm2 delete all || true

# Start application with PM2
pm2 start dist/server/index.js --name "pickntrust-app"
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Install Certbot for SSL
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Configure Nginx with domain
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name www.pickntrust.com pickntrust.com;

    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Serve static files
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

    # Proxy API requests
    location /api/ {
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

    # Serve the React app
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
}

# HTTPS configuration (will be auto-configured by Certbot)
server {
    listen 443 ssl http2;
    server_name www.pickntrust.com pickntrust.com;

    # SSL certificates (will be managed by Certbot)
    # ssl_certificate /etc/letsencrypt/live/www.pickntrust.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/www.pickntrust.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Serve static files
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

    # Proxy API requests
    location /api/ {
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

    # Serve the React app
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
}
NGINXEOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "✅ PickNTrust application deployed successfully!"
echo "🌐 Application URL: http://www.pickntrust.com"
echo "🔑 Admin Panel: http://www.pickntrust.com/admin"
echo ""
echo "🔒 To enable HTTPS, run the following commands:"
echo "sudo certbot --nginx -d www.pickntrust.com -d pickntrust.com"
echo "sudo systemctl reload nginx"
EOF

chmod +x deploy-on-ec2.sh

# Step 12: Wait for EC2 to be ready and deploy
echo -e "\n${YELLOW}Step 12: Waiting for EC2 instance to be ready (this may take a few minutes)...${NC}"
sleep 60

echo -e "${YELLOW}Copying files to EC2 instance...${NC}"
scp -i $KEY_NAME.pem -o StrictHostKeyChecking=no pickntrust-app.tar.gz ubuntu@$PUBLIC_IP:/tmp/
scp -i $KEY_NAME.pem -o StrictHostKeyChecking=no deploy-on-ec2.sh ubuntu@$PUBLIC_IP:/tmp/

echo -e "${YELLOW}Running deployment on EC2 instance...${NC}"
ssh -i $KEY_NAME.pem -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP << 'EOSSH'
sudo mv /tmp/pickntrust-app.tar.gz /opt/pickntrust/
sudo mv /tmp/deploy-on-ec2.sh /opt/pickntrust/
sudo chown -R ubuntu:ubuntu /opt/pickntrust
cd /opt/pickntrust
chmod +x deploy-on-ec2.sh
./deploy-on-ec2.sh
EOSSH

# Step 13: Final output
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "\n${BLUE}📋 Deployment Information:${NC}"
echo -e "${GREEN}Instance ID: $INSTANCE_ID${NC}"
echo -e "${GREEN}Public IP: $PUBLIC_IP${NC}"
echo -e "${GREEN}Application URL: http://$PUBLIC_IP${NC}"
echo -e "${GREEN}Admin Panel: http://$PUBLIC_IP/admin${NC}"
echo -e "${GREEN}SSH Command: ssh -i $KEY_NAME.pem ubuntu@$PUBLIC_IP${NC}"

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Visit http://$PUBLIC_IP to access your application"
echo -e "2. Visit http://$PUBLIC_IP/admin to access the admin panel"
echo -e "3. Use password 'pickntrust2025' for admin access"
echo -e "4. Configure SSL certificate for production use"
echo -e "5. Set up domain name and DNS records"

# Cleanup
rm -f user-data.sh pickntrust-app.tar.gz deploy-on-ec2.sh

echo -e "\n${GREEN}✅ Deployment script completed!${NC}"
