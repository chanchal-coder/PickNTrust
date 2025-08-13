#!/bin/bash
# PickNTrust EC2 Deployment Script
# Run this script on your EC2 instance to deploy the application

set -e

echo "🚀 Starting PickNTrust deployment on EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_error "This script should be run as the ubuntu user"
    exit 1
fi

print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

print_status "Installing PM2, Git, Nginx, and Certbot..."
sudo npm install -g pm2
sudo apt-get install -y git nginx certbot python3-certbot-nginx unzip

print_status "Cleaning up previous deployment..."
# Stop existing services
sudo systemctl stop nginx || true
pm2 stop all || true
pm2 delete all || true
pm2 kill || true

# Remove previous installation
sudo rm -rf /opt/pickntrust
sudo mkdir -p /opt/pickntrust
sudo chown -R ubuntu:ubuntu /opt/pickntrust

# Clean nginx configs
sudo rm -f /etc/nginx/sites-enabled/pickntrust
sudo rm -f /etc/nginx/sites-available/pickntrust
sudo rm -f /etc/nginx/sites-enabled/default

print_status "Setting up application directory..."
cd /opt/pickntrust

# Check if deployment package exists
if [ -f "pickntrust-deployment-package.tar.gz" ]; then
    print_status "Extracting deployment package..."
    tar -xzf pickntrust-deployment-package.tar.gz
else
    print_warning "Deployment package not found. Please upload pickntrust-deployment-package.tar.gz to /opt/pickntrust/"
    print_warning "Or clone your repository manually"
    exit 1
fi

print_status "Creating environment configuration..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
DOMAIN=www.pickntrust.com
FRONTEND_URL=https://www.pickntrust.com
EOF

print_status "Installing dependencies..."
npm install --production

print_status "Building application..."
npm run build

print_status "Starting application with PM2..."
pm2 start dist/server/index.js --name "pickntrust-app"
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.pickntrust.com pickntrust.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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
        proxy_read_timeout 86400;
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
        proxy_read_timeout 86400;
    }
}
EOF

# Enable site and start Nginx
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

print_status "Running deployment tests..."

# Test if app is running
sleep 5
if pm2 list | grep -q "pickntrust-app.*online"; then
    print_status "PM2 application is running"
else
    print_error "PM2 application failed to start"
    pm2 logs pickntrust-app --lines 20
    exit 1
fi

# Test if port 5000 is listening
if netstat -tulpn | grep -q ":5000"; then
    print_status "Application is listening on port 5000"
else
    print_error "Application is not listening on port 5000"
    exit 1
fi

# Test if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx failed to start"
    sudo systemctl status nginx
    exit 1
fi

# Test local API endpoint
if curl -s http://localhost:5000/api/categories > /dev/null; then
    print_status "API endpoint is responding"
else
    print_warning "API endpoint test failed - this might be normal if database is not seeded"
fi

print_status "Getting server information..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "Unable to get public IP")
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 || echo "Unable to get private IP")

echo ""
echo "🎉 PickNTrust deployment completed successfully!"
echo ""
echo "📋 Server Information:"
echo "   Public IP: $PUBLIC_IP"
echo "   Private IP: $PRIVATE_IP"
echo ""
echo "🌐 Access your website:"
echo "   Main site: http://www.pickntrust.com"
echo "   Admin panel: http://www.pickntrust.com/admin"
echo "   API: http://www.pickntrust.com/api"
echo ""
echo "🔧 Management commands:"
echo "   Check status: pm2 status"
echo "   View logs: pm2 logs pickntrust-app"
echo "   Restart app: pm2 restart pickntrust-app"
echo "   Nginx status: sudo systemctl status nginx"
echo ""
echo "🔒 To enable HTTPS (after DNS propagates):"
echo "   sudo certbot --nginx -d www.pickntrust.com -d pickntrust.com"
echo ""
echo "⚠️  Important: Make sure your DNS A records point to: $PUBLIC_IP"
echo ""
print_status "Deployment complete! Your website should be accessible at www.pickntrust.com"
