#!/bin/bash
# Copy-Paste Deployment Script for EC2
# Run this directly on your EC2 instance after SSH connection

set -e

echo "🚀 Starting PickNTrust deployment on EC2..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install and configure Nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Clone repository
echo "📂 Cloning PickNTrust repository..."
cd /home/ec2-user
rm -rf PickNTrust
git clone https://github.com/chanchal-coder/PickNTrust.git PickNTrust
cd PickNTrust

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Create environment file
echo "⚙️ Creating environment file..."
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
ENVEOF

# Start application with PM2
echo "🔄 Starting application with PM2..."
pm2 delete pickntrust 2>/dev/null || true
pm2 start npm --name "pickntrust" -- start
pm2 save
pm2 startup

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'NGINXEOF'
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
}
NGINXEOF

# Remove default Nginx config if it exists
sudo rm -f /etc/nginx/conf.d/default.conf

# Test and start Nginx
echo "🌐 Starting Nginx..."
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Show status
echo "📊 Checking application status..."
pm2 status
sudo systemctl status nginx --no-pager -l

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be live at: http://51.20.43.157"
echo "👨‍💼 Admin panel: http://51.20.43.157/admin"
echo "🔑 Admin login: admin / pickntrust2025"
echo ""
echo "📋 Useful commands:"
echo "  - Check PM2 status: pm2 status"
echo "  - View PM2 logs: pm2 logs pickntrust"
echo "  - Restart app: pm2 restart pickntrust"
echo "  - Check Nginx status: sudo systemctl status nginx"
