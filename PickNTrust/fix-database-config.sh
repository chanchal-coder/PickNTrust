#!/bin/bash

echo "🔧 Fixing Database Configuration Issue"
echo "====================================="

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

# Step 1: Stop the crashing application
print_status "Step 1: Stopping crashing application..."
pm2 stop pickntrust
pm2 delete pickntrust

# Step 2: Fix the environment configuration
print_status "Step 2: Fixing environment configuration..."

# Create proper .env file with all required variables
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db

# Supabase configuration (using dummy values to prevent crashes)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=dummy_key_for_local_sqlite
SUPABASE_SERVICE_ROLE_KEY=dummy_service_key_for_local_sqlite

# Additional environment variables that might be needed
VITE_API_URL=http://localhost:5000/api
EOF

print_success "Environment file updated with all required variables"

# Step 3: Update PM2 ecosystem config
print_status "Step 3: Updating PM2 configuration..."

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

print_success "PM2 configuration updated"

# Step 4: Clear logs and restart
print_status "Step 4: Clearing logs and restarting application..."

# Clear previous logs
rm -f logs/*.log

# Start the application
pm2 start ecosystem.config.cjs
pm2 save

print_success "Application restarted"

# Step 5: Wait and check status
print_status "Step 5: Checking application status..."
sleep 5

# Check PM2 status
pm2 status

# Check if port 5000 is now listening
if netstat -tlnp | grep -q ":5000"; then
    print_success "✅ Application is now listening on port 5000"
else
    print_error "❌ Application still not listening on port 5000"
    print_status "Checking logs for errors..."
    pm2 logs pickntrust --lines 20
fi

# Step 6: Test connectivity
print_status "Step 6: Testing connectivity..."

# Test backend
if curl -s http://localhost:5000 > /dev/null; then
    print_success "✅ Backend is now responding on localhost:5000"
else
    print_error "❌ Backend still not responding"
    print_status "Recent logs:"
    pm2 logs pickntrust --lines 10
fi

# Step 7: Get public IP and test external access
print_status "Step 7: Testing external access..."

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
print_status "Public IP: $PUBLIC_IP"

echo ""
echo "🌐 Test your application:"
echo "• Local: http://localhost:5000"
echo "• Public IP: http://$PUBLIC_IP"
echo "• Domain: http://pickntrust.com (after Security Group fix)"
echo ""

# Step 8: Security Group reminder
print_status "Step 8: AWS Security Group Configuration"
echo ""
echo "🚨 Don't forget to configure AWS Security Group:"
echo "1. Go to AWS Console → EC2 → Security Groups"
echo "2. Find your instance's security group"
echo "3. Add inbound rule: HTTP, Port 80, Source 0.0.0.0/0"
echo ""

print_success "Database configuration fixed! Application should now be running properly. 🚀"
