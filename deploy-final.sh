#!/bin/bash

# PickNTrust - Final Working Deployment Script
# This script fixes all path issues and deploys to AWS EC2

set -e  # Exit on any error

echo "🚀 PickNTrust - Final Deployment Script"
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

# Check if we're on EC2
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "amzn" ]]; then
        print_status "Running on Amazon Linux - EC2 detected"
        IS_EC2=true
    else
        print_status "Running on $PRETTY_NAME"
        IS_EC2=false
    fi
else
    print_status "OS detection failed, assuming local environment"
    IS_EC2=false
fi

# Step 1: Clean up previous builds and processes
print_status "Step 1: Cleaning up previous builds and processes..."

# Stop any running processes
pkill -f "node.*server" || true
pkill -f "vite" || true
pkill -f "tsx" || true

# Stop PM2 processes if they exist
if command -v pm2 &> /dev/null; then
    pm2 stop all || true
    pm2 delete all || true
fi

# Clean build directories
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf client/dist/

print_success "Cleanup completed"

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."

if [ "$IS_EC2" = true ]; then
    # Update system packages on EC2
    sudo yum update -y
    
    # Install Node.js 18+ if not present
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
        print_status "Installing Node.js 18..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    # Install PM2 globally if not present
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Install nginx if not present
    if ! command -v nginx &> /dev/null; then
        print_status "Installing Nginx..."
        sudo yum install -y nginx
    fi
fi

# Install project dependencies
print_status "Installing npm dependencies..."
npm install

print_success "Dependencies installed"

# Step 3: Build the application
print_status "Step 3: Building the application..."

# Set NODE_ENV for build
export NODE_ENV=production

# Build frontend and backend
print_status "Building frontend with Vite..."
npm run build

# Verify build output
if [ ! -d "dist/public" ]; then
    print_error "Frontend build failed - dist/public directory not found"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    print_error "Frontend build failed - index.html not found"
    exit 1
fi

if [ ! -f "dist/server/index.js" ]; then
    print_error "Backend build failed - server/index.js not found"
    exit 1
fi

print_success "Build completed successfully"
print_status "Frontend built to: dist/public"
print_status "Backend built to: dist/server"

# Step 4: Database setup
print_status "Step 4: Setting up database..."

# Create database if it doesn't exist
if [ ! -f "sqlite.db" ]; then
    print_status "Creating SQLite database..."
    touch sqlite.db
fi

# Run database migrations
print_status "Running database migrations..."
npm run db:push || print_warning "Database push failed - continuing anyway"

print_success "Database setup completed"

# Step 5: Configure environment
print_status "Step 5: Configuring environment..."

# Create .env file (always overwrite to ensure correct config)
print_status "Creating .env file..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
EOF

print_success "Environment configured"

# Step 6: Start the application
print_status "Step 6: Starting the application..."

if [ "$IS_EC2" = true ]; then
    # EC2 deployment with PM2
    print_status "Starting with PM2 on EC2..."
    
    # Create PM2 ecosystem file (use .cjs extension for CommonJS)
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
    
    # Start with PM2
    pm2 start ecosystem.config.cjs
    pm2 save
    pm2 startup
    
    # Configure Nginx
    print_status "Configuring Nginx..."
    
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
    
    print_success "PM2 and Nginx configured"
    
else
    # Local development
    print_status "Starting locally..."
    NODE_ENV=production node dist/server/index.js &
    SERVER_PID=$!
    echo $SERVER_PID > server.pid
    print_success "Server started locally on port 5000"
fi

# Step 7: Verify deployment
print_status "Step 7: Verifying deployment..."

sleep 5

# Check if server is running
if curl -f http://localhost:5000/api/health &> /dev/null; then
    print_success "✅ Backend is responding"
else
    print_warning "⚠️  Backend health check failed, but server might still be starting..."
fi

# Check if frontend files are accessible
if [ -f "dist/public/index.html" ]; then
    print_success "✅ Frontend files are built and accessible"
else
    print_error "❌ Frontend files not found"
fi

# Final status
print_success "🎉 Deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "• Frontend: Built to dist/public"
echo "• Backend: Built to dist/server"
echo "• Database: SQLite (sqlite.db)"
echo "• Port: 5000"

if [ "$IS_EC2" = true ]; then
    echo "• Process Manager: PM2"
    echo "• Web Server: Nginx"
    echo "• Domain: pickntrust.com"
    echo ""
    echo "🔧 Useful Commands:"
    echo "• Check status: pm2 status"
    echo "• View logs: pm2 logs pickntrust"
    echo "• Restart: pm2 restart pickntrust"
    echo "• Stop: pm2 stop pickntrust"
    echo ""
    echo "🌐 Your site should be available at:"
    echo "• http://pickntrust.com"
    echo "• http://www.pickntrust.com"
else
    echo "• Environment: Local"
    echo ""
    echo "🌐 Your site should be available at:"
    echo "• http://localhost:5000"
fi

echo ""
print_success "Deployment script completed successfully! 🚀"
