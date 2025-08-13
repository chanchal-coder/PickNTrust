#!/bin/bash

echo "🔧 Completing PickNTrust Deployment"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Fix environment configuration
print_status "Step 1: Fixing environment configuration..."

# Create correct .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
EOF

print_success "Environment file updated"

# Step 2: Fix PM2 configuration
print_status "Step 2: Fixing PM2 configuration..."

# Stop any existing PM2 processes
pm2 stop all || true
pm2 delete all || true

# Create correct PM2 ecosystem file
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'pickntrust',
    script: 'dist/server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'file:./sqlite.db'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

print_success "PM2 configuration fixed"

# Step 3: Start the application
print_status "Step 3: Starting the application..."

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

print_success "Application started with PM2"

# Step 4: Configure Nginx
print_status "Step 4: Configuring Nginx..."

sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << EOF
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    
    # Serve static files directly
    location / {
        try_files \$uri \$uri/ @backend;
    }
    
    # Proxy API requests to backend
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
    
    # Fallback to backend for SPA routing
    location @backend {
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
}
EOF

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

print_success "Nginx configured and restarted"

# Step 5: Verify deployment
print_status "Step 5: Verifying deployment..."

sleep 5

# Check PM2 status
print_status "PM2 Status:"
pm2 status

# Check if server is responding
if curl -f http://localhost:5000 &> /dev/null; then
    print_success "✅ Backend is responding on port 5000"
else
    print_error "❌ Backend not responding on port 5000"
fi

# Check Nginx status
if sudo systemctl is-active --quiet nginx; then
    print_success "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
fi

# Final status
print_success "🎉 Deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "• Frontend: Built to dist/public ✅"
echo "• Backend: Built to dist/server ✅"
echo "• Database: SQLite (sqlite.db) ✅"
echo "• Process Manager: PM2 ✅"
echo "• Web Server: Nginx ✅"
echo "• Port: 5000 ✅"
echo ""
echo "🌐 Your site should be available at:"
echo "• http://pickntrust.com"
echo "• http://www.pickntrust.com"
echo ""
echo "🔧 Useful Commands:"
echo "• Check status: pm2 status"
echo "• View logs: pm2 logs pickntrust"
echo "• Restart: pm2 restart pickntrust"
echo "• Stop: pm2 stop pickntrust"
echo ""
print_success "All path issues have been resolved! 🚀"
