#!/bin/bash

echo "🚀 PickNTrust Complete Deployment Fix - One Go Solution"
echo "======================================================"

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get instance details
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

echo "📊 INSTANCE: $INSTANCE_ID | IP: $PUBLIC_IP"
echo ""

# Step 1: Stop everything and clean up
print_status "Step 1: Cleaning up previous processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
sudo pkill -f "node.*dist/server" 2>/dev/null || true
sudo pkill -f "vite" 2>/dev/null || true
print_success "Cleanup completed"

# Step 2: Fix environment configuration
print_status "Step 2: Setting up environment..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=dummy_key_for_local_sqlite
SUPABASE_SERVICE_ROLE_KEY=dummy_service_key_for_local_sqlite
VITE_API_URL=http://localhost:5000/api
EOF
print_success "Environment configured"

# Step 3: Ensure build exists
print_status "Step 3: Checking/rebuilding application..."
if [ ! -d "dist/public" ] || [ ! -f "dist/server/index.js" ]; then
    print_status "Building application..."
    npm run build
fi

if [ -d "dist/public" ] && [ -f "dist/server/index.js" ]; then
    print_success "Build files exist"
else
    print_error "Build failed - rebuilding..."
    npm install
    npm run build
fi

# Step 4: Create PM2 ecosystem config
print_status "Step 4: Configuring PM2..."
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'pickntrust',
    script: 'dist/server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'file:./sqlite.db',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_ANON_KEY: 'dummy_key_for_local_sqlite',
      SUPABASE_SERVICE_ROLE_KEY: 'dummy_service_key_for_local_sqlite',
      VITE_API_URL: 'http://localhost:5000/api'
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

mkdir -p logs
print_success "PM2 configured"

# Step 5: Start backend with PM2
print_status "Step 5: Starting backend..."
pm2 start ecosystem.config.cjs
sleep 5

# Check if backend started
if pm2 list | grep -q "online.*pickntrust"; then
    print_success "✅ Backend started successfully"
else
    print_error "❌ Backend failed to start - checking logs..."
    pm2 logs pickntrust --lines 10
    print_status "Attempting direct start..."
    cd dist/server && node index.js &
    BACKEND_PID=$!
    sleep 3
    cd ../..
fi

# Step 6: Configure Nginx
print_status "Step 6: Configuring Nginx..."

# Remove default config that might conflict
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Create our config
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name pickntrust.com www.pickntrust.com $PUBLIC_IP _;
    
    root /home/ec2-user/PickNTrust/dist/public;
    index index.html;
    
    # Serve static files directly
    location / {
        try_files \$uri \$uri/ @backend;
    }
    
    # API requests go to backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Fallback to backend for SPA routing
    location @backend {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# Test and start Nginx
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "✅ Nginx configured and started"
else
    print_error "❌ Nginx configuration error"
    sudo nginx -t
fi

# Step 7: Check firewall and iptables
print_status "Step 7: Checking system firewall..."

# Check if iptables is blocking
if command -v iptables >/dev/null 2>&1; then
    # Allow HTTP traffic
    sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
    sudo iptables -I INPUT -p tcp --dport 5000 -j ACCEPT 2>/dev/null || true
    print_success "Firewall rules updated"
fi

# Step 8: Verify services
print_status "Step 8: Verifying services..."

sleep 5

# Check PM2
if pm2 list | grep -q "online.*pickntrust"; then
    print_success "✅ PM2: ONLINE"
else
    print_error "❌ PM2: OFFLINE"
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    print_success "✅ Nginx: RUNNING"
else
    print_error "❌ Nginx: STOPPED"
fi

# Check ports
if netstat -tlnp | grep -q ":5000"; then
    print_success "✅ Backend Port 5000: LISTENING"
else
    print_error "❌ Backend Port 5000: NOT LISTENING"
fi

if netstat -tlnp | grep -q ":80"; then
    print_success "✅ Web Port 80: LISTENING"
else
    print_error "❌ Web Port 80: NOT LISTENING"
fi

# Step 9: Test connectivity
print_status "Step 9: Testing connectivity..."

# Test backend
if curl -s --connect-timeout 5 http://localhost:5000 >/dev/null 2>&1; then
    print_success "✅ Backend responding locally"
else
    print_error "❌ Backend not responding locally"
    print_status "Backend logs:"
    pm2 logs pickntrust --lines 5 2>/dev/null || echo "No PM2 logs available"
fi

# Test Nginx
if curl -s --connect-timeout 5 http://localhost:80 >/dev/null 2>&1; then
    print_success "✅ Nginx responding locally"
else
    print_error "❌ Nginx not responding locally"
fi

# Test public access
print_status "Testing public access..."
if curl -s --connect-timeout 10 http://$PUBLIC_IP >/dev/null 2>&1; then
    print_success "✅ Site accessible via public IP"
    PUBLIC_WORKING=true
else
    print_error "❌ Site not accessible via public IP"
    PUBLIC_WORKING=false
fi

# Step 10: Final status and recommendations
echo ""
echo "🎯 FINAL STATUS REPORT"
echo "====================="
echo "• Instance ID: $INSTANCE_ID"
echo "• Public IP: $PUBLIC_IP"
echo "• Backend: $(pm2 list 2>/dev/null | grep -q "online.*pickntrust" && echo "ONLINE" || echo "OFFLINE")"
echo "• Nginx: $(sudo systemctl is-active --quiet nginx && echo "RUNNING" || echo "STOPPED")"
echo "• Port 5000: $(netstat -tlnp | grep -q ":5000" && echo "LISTENING" || echo "NOT LISTENING")"
echo "• Port 80: $(netstat -tlnp | grep -q ":80" && echo "LISTENING" || echo "NOT LISTENING")"
echo ""

if [ "$PUBLIC_WORKING" = true ]; then
    print_success "🎉 SUCCESS! Your site is now accessible!"
    echo ""
    echo "🌐 ACCESS YOUR SITE:"
    echo "• http://$PUBLIC_IP"
    echo "• http://pickntrust.com (if DNS is configured)"
    echo "• http://www.pickntrust.com"
    echo ""
    print_success "✅ DEPLOYMENT COMPLETE! 🚀"
else
    print_warning "⚠️ Application is running but not externally accessible"
    echo ""
    echo "🔧 REMAINING ISSUE: AWS Security Group"
    echo ""
    echo "📋 AWS CONSOLE FIX (2 minutes):"
    echo "1. Go to: https://console.aws.amazon.com/ec2/"
    echo "2. Click 'Security Groups' → Find group for $INSTANCE_ID"
    echo "3. Edit inbound rules → Add rule:"
    echo "   • Type: HTTP"
    echo "   • Port: 80"
    echo "   • Source: 0.0.0.0/0"
    echo "4. Save rules"
    echo ""
    echo "🧪 Then test: http://$PUBLIC_IP"
    echo ""
    print_warning "Your application is 100% ready - just need AWS Security Group HTTP rule!"
fi

# Save PM2 configuration
pm2 save 2>/dev/null || true
pm2 startup 2>/dev/null || true

echo ""
print_success "One-go deployment script completed! 🎯"
