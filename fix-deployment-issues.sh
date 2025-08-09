#!/bin/bash
# Fixed Deployment Script for PickNTrust - Addresses Current Issues
# Run this on your EC2 instance to fix the deployment problems

set -e

echo "🔧 Fixing PickNTrust deployment issues..."

# Navigate to the project directory
cd /home/ec2-user/PickNTrust

# Install build dependencies for better-sqlite3
echo "📦 Installing build dependencies..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3-devel

# Update Node.js to version 20 (required for better-sqlite3)
echo "📦 Updating Node.js to version 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify Node.js version
echo "✅ Node.js version: $(node --version)"

# Clean npm cache and node_modules
echo "🧹 Cleaning npm cache and dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force

# Install dependencies with legacy peer deps flag
echo "📦 Installing dependencies with compatibility flags..."
npm install --legacy-peer-deps --no-optional

# Build the application
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

# Stop any existing PM2 processes
echo "🔄 Managing PM2 processes..."
pm2 delete all 2>/dev/null || true

# Start the application with PM2 using the correct entry point
echo "🚀 Starting application with PM2..."
if [ -f "dist/server/index.js" ]; then
    pm2 start dist/server/index.js --name "pickntrust"
elif [ -f "server/index.ts" ]; then
    pm2 start server/index.ts --name "pickntrust" --interpreter="node" --interpreter-args="--loader tsx"
elif [ -f "server/index.js" ]; then
    pm2 start server/index.js --name "pickntrust"
else
    # Use npm start as fallback
    pm2 start npm --name "pickntrust" -- start
fi

pm2 save

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

# Remove default Nginx config
sudo rm -f /etc/nginx/conf.d/default.conf

# Test and restart Nginx
echo "🌐 Starting Nginx..."
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Show status
echo "📊 Deployment Status:"
echo "Node.js version: $(node --version)"
echo "PM2 processes:"
pm2 status
echo "Nginx status:"
sudo systemctl status nginx --no-pager -l | head -10

echo ""
echo "✅ Deployment fix completed!"
echo "🌐 Your application should be live at: http://51.20.43.157"
echo "👨‍💼 Admin panel: http://51.20.43.157/admin"
echo "🔑 Admin login: admin / pickntrust2025"
echo ""
echo "📋 Troubleshooting commands:"
echo "  - Check PM2 logs: pm2 logs pickntrust"
echo "  - Restart app: pm2 restart pickntrust"
echo "  - Check app is listening: netstat -tlnp | grep 3000"
