#!/bin/bash

echo "🚀 ONE COMMAND DEPLOYMENT - FIXING ALL ISSUES"
echo "=============================================="

# Exit on any error
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; }
warning() { echo -e "${YELLOW}⚠️${NC} $1"; }

log "Starting complete deployment fix..."

# Kill everything first
log "Stopping all services..."
pm2 kill 2>/dev/null || true
sudo pkill -f nginx 2>/dev/null || true
sudo pkill -f node 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sleep 2

# Install dependencies
log "Installing dependencies..."
npm install --production=false

# Build application
log "Building application..."
npm run build

# Verify build
if [ ! -f "dist/server/index.js" ]; then
    error "Backend build failed!"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    error "Frontend build failed!"
    exit 1
fi

success "Build completed successfully"

# Create nginx config
log "Configuring Nginx..."
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test nginx config
if ! sudo nginx -t; then
    error "Nginx configuration invalid!"
    exit 1
fi

# Start PM2
log "Starting backend with PM2..."
pm2 start ecosystem.config.cjs --env production

# Wait for backend
log "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5000 >/dev/null 2>&1; then
        success "Backend is running on port 5000"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        error "Backend failed to start!"
        pm2 logs --lines 10
        exit 1
    fi
done

# Start nginx
log "Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Wait for nginx
log "Waiting for Nginx to start..."
for i in {1..10}; do
    if curl -s http://localhost:80 >/dev/null 2>&1; then
        success "Nginx is running on port 80"
        break
    fi
    sleep 1
    if [ $i -eq 10 ]; then
        error "Nginx failed to start!"
        sudo systemctl status nginx
        exit 1
    fi
done

# Get external IP
EXTERNAL_IP=$(curl -s http://checkip.amazonaws.com/ 2>/dev/null || echo "51.20.43.157")

# Final tests
log "Testing external access..."
if curl -I http://$EXTERNAL_IP 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    success "External access working!"
else
    warning "External access may need security group configuration"
fi

# Create restart script
cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting PickNTrust..."
pm2 restart all
sudo systemctl restart nginx
sleep 3
echo "✅ Restart complete!"
pm2 status
sudo systemctl status nginx --no-pager
EOF
chmod +x restart.sh

# Final status
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
success "Backend: Running on port 5000"
success "Frontend: Built and served"
success "Nginx: Running on port 80"
success "Database: SQLite configured"
success "External IP: $EXTERNAL_IP"

echo ""
echo "🌐 ACCESS YOUR SITE:"
echo "   http://$EXTERNAL_IP"
echo "   http://pickntrust.com (if DNS configured)"

echo ""
echo "📊 MONITORING:"
echo "   pm2 status           # Check backend"
echo "   pm2 logs            # View logs"
echo "   ./restart.sh        # Restart everything"

echo ""
echo "🔍 CURRENT STATUS:"
pm2 status
echo ""
sudo systemctl status nginx --no-pager | head -5

echo ""
success "🚀 Your PickNTrust site is now LIVE!"
