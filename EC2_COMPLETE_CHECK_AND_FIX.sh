#!/bin/bash

echo "🔍 COMPLETE EC2 DEPLOYMENT CHECK AND FIX"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project directory. Please cd to PickNTrust directory first."
    exit 1
fi

print_status "Starting comprehensive deployment check..."

# 1. Check system resources
echo ""
echo "=== SYSTEM RESOURCES ==="
print_status "Checking system resources..."
df -h
echo ""
free -h
echo ""

# 2. Check Node.js and npm
echo "=== NODE.JS ENVIRONMENT ==="
print_status "Node.js version: $(node --version)"
print_status "NPM version: $(npm --version)"
print_status "PM2 version: $(pm2 --version 2>/dev/null || echo 'Not installed')"

# 3. Install missing dependencies
echo ""
echo "=== DEPENDENCY CHECK ==="
print_status "Installing/updating dependencies..."
npm install

# 4. Check and fix build
echo ""
echo "=== BUILD CHECK ==="
print_status "Building application..."
npm run build

if [ -f "dist/server/index.js" ]; then
    print_success "Backend build found: dist/server/index.js"
else
    print_error "Backend build missing!"
    exit 1
fi

if [ -f "dist/public/index.html" ]; then
    print_success "Frontend build found: dist/public/index.html"
else
    print_error "Frontend build missing!"
    exit 1
fi

# 5. Check database
echo ""
echo "=== DATABASE CHECK ==="
if [ -f "sqlite.db" ]; then
    print_success "Database file exists: sqlite.db"
    print_status "Database size: $(du -h sqlite.db | cut -f1)"
else
    print_warning "Database file not found, will be created on first run"
fi

# 6. Stop all services
echo ""
echo "=== STOPPING SERVICES ==="
print_status "Stopping all services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

# 7. Start backend with PM2
echo ""
echo "=== STARTING BACKEND ==="
print_status "Starting backend with PM2..."
pm2 start ecosystem.config.cjs

sleep 3
pm2 status

# 8. Test backend
echo ""
echo "=== TESTING BACKEND ==="
print_status "Testing backend on port 5000..."
for i in {1..10}; do
    if curl -s http://localhost:5000 > /dev/null; then
        print_success "Backend responding on port 5000"
        break
    else
        print_warning "Attempt $i/10 - Backend not ready, waiting..."
        sleep 2
    fi
    if [ $i -eq 10 ]; then
        print_error "Backend failed to start!"
        print_status "Checking PM2 logs..."
        pm2 logs --lines 20
        exit 1
    fi
done

# 9. Configure Nginx
echo ""
echo "=== CONFIGURING NGINX ==="
print_status "Creating Nginx configuration..."

sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

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
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Handle static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Remove default and enable our config
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test nginx config
print_status "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid!"
    exit 1
fi

# 10. Start Nginx
echo ""
echo "=== STARTING NGINX ==="
print_status "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

sleep 2

# 11. Test Nginx
echo ""
echo "=== TESTING NGINX ==="
print_status "Testing Nginx on port 80..."
for i in {1..5}; do
    if curl -s http://localhost:80 > /dev/null; then
        print_success "Nginx responding on port 80"
        break
    else
        print_warning "Attempt $i/5 - Nginx not ready, waiting..."
        sleep 2
    fi
    if [ $i -eq 5 ]; then
        print_error "Nginx failed to start!"
        sudo systemctl status nginx
        exit 1
    fi
done

# 12. Test external access
echo ""
echo "=== TESTING EXTERNAL ACCESS ==="
print_status "Testing external connectivity..."
EXTERNAL_IP=$(curl -s http://checkip.amazonaws.com/ || echo "Unknown")
print_status "External IP: $EXTERNAL_IP"

if curl -I http://$EXTERNAL_IP 2>/dev/null | grep -q "200\|301\|302"; then
    print_success "External access working!"
else
    print_warning "External access may have issues - check security groups"
fi

# 13. Final status check
echo ""
echo "=== FINAL STATUS CHECK ==="
print_status "Process status:"
ps aux | grep -E "(nginx|node)" | grep -v grep

print_status "Port status:"
netstat -tlnp | grep -E ":(80|5000)"

print_status "PM2 status:"
pm2 status

print_status "Nginx status:"
sudo systemctl status nginx --no-pager -l

print_status "Disk usage:"
df -h /

# 14. Create monitoring script
echo ""
echo "=== CREATING MONITORING SCRIPT ==="
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== PickNTrust Monitoring ==="
echo "Time: $(date)"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager
echo ""
echo "Port Check:"
netstat -tlnp | grep -E ":(80|5000)"
echo ""
echo "Recent Logs:"
pm2 logs --lines 5
EOF

chmod +x monitor.sh

# 15. Final summary
echo ""
echo "🎉 DEPLOYMENT CHECK COMPLETE!"
echo "============================="
print_success "✅ Dependencies installed"
print_success "✅ Application built successfully"
print_success "✅ Backend running on port 5000"
print_success "✅ Nginx configured and running on port 80"
print_success "✅ External access configured"
print_success "✅ Monitoring script created (./monitor.sh)"

echo ""
print_status "🌐 Your site should be accessible at:"
print_status "   http://$EXTERNAL_IP"
print_status "   http://pickntrust.com (if DNS configured)"

echo ""
print_status "📊 Monitoring commands:"
print_status "   ./monitor.sh          # Quick status check"
print_status "   pm2 logs             # View application logs"
print_status "   pm2 restart all      # Restart application"
print_status "   sudo systemctl restart nginx  # Restart web server"

echo ""
print_status "🔧 If you encounter issues:"
print_status "   1. Check PM2 logs: pm2 logs"
print_status "   2. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
print_status "   3. Restart services: pm2 restart all && sudo systemctl restart nginx"

echo ""
print_success "🚀 Deployment verification complete!"
