#!/bin/bash

# PickNTrust AWS EC2 Deployment Script
# Usage: ./deploy-to-ec2.sh [EC2_IP] [KEY_FILE] [DOMAIN]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_IP=${1:-""}
KEY_FILE=${2:-"~/.ssh/id_rsa"}
DOMAIN=${3:-""}
APP_NAME="pickntrust"
APP_DIR="/var/www/PickNTrust"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$EC2_IP" ]; then
    print_error "Please provide EC2 IP address"
    echo "Usage: ./deploy-to-ec2.sh [EC2_IP] [KEY_FILE] [DOMAIN]"
    exit 1
fi

print_status "Starting deployment to EC2 instance: $EC2_IP"

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_error "Cannot connect to EC2 instance. Please check your IP and key file."
    exit 1
fi
print_success "SSH connection established"

# Create deployment script
print_status "Creating deployment script..."
cat > /tmp/ec2-deploy.sh << 'EOF'
#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
print_success "Node.js installed: $(node --version)"

# Install PM2
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
print_success "PM2 installed: $(pm2 --version)"

# Install Nginx
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi
print_success "Nginx installed and running"

# Install Git
print_status "Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install git -y
fi

# Create app directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www
cd /var/www

# Clone or update repository
if [ -d "PickNTrust" ]; then
    print_status "Updating existing repository..."
    cd PickNTrust
    sudo git pull origin main || true
else
    print_status "Cloning repository..."
    # Note: You'll need to replace this with your actual repository URL
    sudo git clone https://github.com/yourusername/PickNTrust.git || {
        print_error "Failed to clone repository. Please update the repository URL in the script."
        exit 1
    }
    cd PickNTrust
fi

# Set proper ownership
sudo chown -R ubuntu:ubuntu /var/www/PickNTrust
cd /var/www/PickNTrust

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build application
print_status "Building application..."
npm run build

# Verify build
if [ ! -d "dist/public" ] || [ ! -f "dist/public/index.html" ]; then
    print_error "Build failed - dist/public/index.html not found"
    exit 1
fi
print_success "Application built successfully"

# Create environment file
print_status "Creating environment configuration..."
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
ENVEOF

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [{
    name: 'pickntrust',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
PMEOF

# Create logs directory
mkdir -p logs

# Initialize database if needed
print_status "Initializing database..."
if [ ! -f "sqlite.db" ]; then
    npm run db:push || true
fi

# Start/restart application with PM2
print_status "Starting application with PM2..."
pm2 delete pickntrust 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
print_status "Configuring PM2 startup..."
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu | grep -E '^sudo' | bash || true

print_success "Application started successfully"
EOF

# Copy and execute deployment script
print_status "Copying deployment script to EC2..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no /tmp/ec2-deploy.sh ubuntu@"$EC2_IP":/tmp/

print_status "Executing deployment script on EC2..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" "chmod +x /tmp/ec2-deploy.sh && /tmp/ec2-deploy.sh"

# Configure Nginx
print_status "Configuring Nginx..."
NGINX_CONFIG="/tmp/pickntrust-nginx.conf"

if [ -n "$DOMAIN" ]; then
    SERVER_NAME="$DOMAIN www.$DOMAIN"
else
    SERVER_NAME="$EC2_IP"
fi

cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $SERVER_NAME;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Copy Nginx configuration
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no "$NGINX_CONFIG" ubuntu@"$EC2_IP":/tmp/

# Configure Nginx on server
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" << 'NGINXEOF'
# Copy nginx configuration
sudo cp /tmp/pickntrust-nginx.conf /etc/nginx/sites-available/pickntrust

# Enable site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo "Nginx configured successfully"
else
    echo "Nginx configuration test failed"
    exit 1
fi
NGINXEOF

# Setup firewall
print_status "Configuring firewall..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" << 'FWEOF'
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
FWEOF

# Create update script
print_status "Creating update script..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" << 'UPDATEEOF'
cat > /var/www/PickNTrust/update-app.sh << 'SCRIPTEOF'
#!/bin/bash
cd /var/www/PickNTrust

echo "Updating PickNTrust application..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Restart PM2
pm2 restart pickntrust

echo "Application updated successfully!"
SCRIPTEOF

chmod +x /var/www/PickNTrust/update-app.sh
UPDATEEOF

# Final verification
print_status "Performing final verification..."
sleep 5

# Test application
if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost:5000" | grep -q "200"; then
    print_success "Application is responding correctly"
else
    print_warning "Application may not be responding correctly"
fi

# Cleanup
rm -f /tmp/ec2-deploy.sh /tmp/pickntrust-nginx.conf

print_success "Deployment completed successfully!"
echo ""
echo "🎉 Your PickNTrust application is now deployed!"
echo ""
echo "📋 Deployment Summary:"
echo "   • Server: $EC2_IP"
if [ -n "$DOMAIN" ]; then
    echo "   • Domain: http://$DOMAIN"
fi
echo "   • Application: http://$EC2_IP"
echo "   • Backend API: http://$EC2_IP/api"
echo ""
echo "🔧 Management Commands:"
echo "   • Check status: ssh -i $KEY_FILE ubuntu@$EC2_IP 'pm2 status'"
echo "   • View logs: ssh -i $KEY_FILE ubuntu@$EC2_IP 'pm2 logs pickntrust'"
echo "   • Update app: ssh -i $KEY_FILE ubuntu@$EC2_IP '/var/www/PickNTrust/update-app.sh'"
echo ""
echo "🔒 Next Steps:"
if [ -n "$DOMAIN" ]; then
    echo "   • Setup SSL: ssh -i $KEY_FILE ubuntu@$EC2_IP 'sudo certbot --nginx -d $DOMAIN'"
fi
echo "   • Configure domain DNS to point to $EC2_IP"
echo "   • Setup monitoring and backups"
echo ""
print_success "Happy deploying! 🚀"
