#!/bin/bash
# COMPLETE EC2 DEPLOYMENT SCRIPT FOR PICKNTRUST
# Run this script on your fresh EC2 instance after cloning the repo

set -e  # Exit on any error

echo "🚀 Starting PickNTrust deployment on fresh EC2 instance..."

# ============================================
# STEP 1: SYSTEM UPDATE & BASIC DEPENDENCIES
# ============================================
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "📦 Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common

# ============================================
# STEP 2: NODE.JS INSTALLATION (Latest LTS)
# ============================================
echo "📦 Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# ============================================
# STEP 3: PM2 INSTALLATION (Process Manager)
# ============================================
echo "📦 Installing PM2 globally..."
sudo npm install -g pm2

# ============================================
# STEP 4: NGINX INSTALLATION & CONFIGURATION
# ============================================
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ============================================
# STEP 5: PROJECT SETUP
# ============================================
echo "📁 Setting up project directory..."
cd /home/ubuntu

# Clone your repository (replace with your actual repo URL)
echo "📥 Cloning repository..."
# git clone https://github.com/YOUR_USERNAME/PickNTrust.git
# cd PickNTrust

# If you're already in the project directory, skip the clone
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project directory."
    exit 1
fi

echo "📦 Installing project dependencies..."
npm install

# ============================================
# STEP 6: BUILD THE PROJECT
# ============================================
echo "🔨 Building the project..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"
ls -la dist/

# ============================================
# STEP 7: DATABASE SETUP
# ============================================
echo "🗄️ Setting up database..."

# Install SQLite if not present
sudo apt install -y sqlite3

# Create database with all tables
echo "📊 Creating database with complete schema..."
sqlite3 sqlite.db < migrations/0001_init.sql

# Verify database creation
echo "📋 Verifying database tables..."
sqlite3 sqlite.db ".tables"

# ============================================
# STEP 8: NGINX CONFIGURATION
# ============================================
echo "⚙️ Configuring Nginx..."

# Create Nginx configuration for PickNTrust
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null <<EOF
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Serve static files from dist/public
    location / {
        root /home/ubuntu/PickNTrust/dist/public;
        try_files \$uri \$uri/ @backend;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API routes to backend
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Webhook routes
    location /webhook {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Fallback to backend for SPA routing
    location @backend {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Nginx configured successfully"

# ============================================
# STEP 9: SSL CERTIFICATE (Let's Encrypt)
# ============================================
echo "🔒 Setting up SSL certificate..."

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your actual domain)
echo "📜 Obtaining SSL certificate..."
echo "⚠️  Make sure your domain DNS points to this server before running:"
echo "sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com"
echo "⚠️  Run the above command manually after DNS is configured"

# ============================================
# STEP 10: ENVIRONMENT VARIABLES
# ============================================
echo "⚙️ Setting up environment variables..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Production Environment Variables
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=sqlite:./sqlite.db

# Telegram Bot Tokens (replace with your actual tokens)
TELEGRAM_BOT_TOKEN_1=your_bot_token_1
TELEGRAM_BOT_TOKEN_2=your_bot_token_2
TELEGRAM_BOT_TOKEN_3=your_bot_token_3
TELEGRAM_BOT_TOKEN_4=your_bot_token_4
TELEGRAM_BOT_TOKEN_5=your_bot_token_5

# Webhook URL
WEBHOOK_URL=https://pickntrust.com/webhook

# Admin Password
ADMIN_PASSWORD=your_secure_admin_password

# API Keys (add your actual keys)
CANVA_API_KEY=your_canva_api_key
CANVA_API_SECRET=your_canva_api_secret
EOF
    echo "⚠️  Please update .env file with your actual tokens and keys"
else
    echo "✅ .env file already exists"
fi

# ============================================
# STEP 11: PM2 PROCESS SETUP
# ============================================
echo "🔄 Setting up PM2 process..."

# Start the application with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
echo "⚠️  Run the command shown above to enable PM2 startup"

# ============================================
# STEP 12: FIREWALL CONFIGURATION
# ============================================
echo "🔥 Configuring firewall..."

# Enable UFW firewall
sudo ufw --force enable

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# Show firewall status
sudo ufw status

# ============================================
# STEP 13: FINAL VERIFICATION
# ============================================
echo "🔍 Final verification..."

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Check Nginx status
echo "📊 Nginx Status:"
sudo systemctl status nginx --no-pager

# Check if application is responding
echo "📊 Testing application..."
curl -I http://localhost:5000 || echo "⚠️  Application not responding on port 5000"

# Check database
echo "📊 Database tables:"
sqlite3 sqlite.db ".tables"

# Show logs
echo "📋 Recent PM2 logs:"
pm2 logs --lines 10

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env file with your actual tokens and keys"
echo "2. Configure DNS to point to this server"
echo "3. Run: sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com"
echo "4. Test your website: https://pickntrust.com"
echo ""
echo "📊 Useful Commands:"
echo "- Check PM2 status: pm2 status"
echo "- View logs: pm2 logs"
echo "- Restart app: pm2 restart pickntrust"
echo "- Check Nginx: sudo nginx -t"
echo "- Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "🎯 Your PickNTrust website should now be running!"