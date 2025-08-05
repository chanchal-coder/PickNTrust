#!/bin/bash

# PickTrustDeals Deployment Script
# One-command deployment with GitHub automation
# Usage: ./deploy/deploy.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="picktrustdeals"
REPO_URL="https://github.com/your-username/picktrustdeals.git"
DEFAULT_BRANCH="main"
ENVIRONMENT=${1:-production}

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
    
    # Check required tools
    command -v git >/dev/null 2>&1 || error "git is required but not installed"
    command -v node >/dev/null 2>&1 || error "node is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    command -v pm2 >/dev/null 2>&1 || warning "pm2 is not installed, will install it"
    
    log "Prerequisites check passed"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update
            sudo apt-get install -y nginx git curl wget unzip
        elif command -v yum >/dev/null 2>&1; then
            sudo yum update -y
            sudo yum install -y nginx git curl wget unzip
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew >/dev/null 2>&1; then
            brew install nginx git curl wget unzip
        fi
    fi
    
    # Install PM2 globally
    if ! command -v pm2 >/dev/null 2>&1; then
        sudo npm install -g pm2
    fi
    
    log "Dependencies installed successfully"
}

# Setup GitHub CLI for automation
setup_github_cli() {
    log "Setting up GitHub CLI..."
    
    if ! command -v gh >/dev/null 2>&1; then
        log "Installing GitHub CLI..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh -y
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install gh
        fi
    fi
    
    # Authenticate GitHub CLI
    if ! gh auth status >/dev/null 2>&1; then
        log "Please authenticate GitHub CLI by running: gh auth login"
        gh auth login
    fi
    
    log "GitHub CLI setup complete"
}

# Clone or update repository
setup_repository() {
    log "Setting up repository..."
    
    if [ -d "$APP_NAME" ]; then
        log "Updating existing repository..."
        cd "$APP_NAME"
        git pull origin "$DEFAULT_BRANCH"
    else
        log "Cloning repository..."
        git clone "$REPO_URL" "$APP_NAME"
        cd "$APP_NAME"
    fi
    
    log "Repository setup complete"
}

# Install dependencies
install_app_dependencies() {
    log "Installing application dependencies..."
    
    npm ci --production
    
    log "Dependencies installed successfully"
}

# Build application
build_application() {
    log "Building application..."
    
    npm run build
    
    log "Application built successfully"
}

# Setup PM2
setup_pm2() {
    log "Setting up PM2..."
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '${ENVIRONMENT}',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
    
    # Start application with PM2
    pm2 start ecosystem.config.js --env ${ENVIRONMENT}
    pm2 save
    
    log "PM2 setup complete"
}

# Setup Nginx
setup_nginx() {
    log "Setting up Nginx..."
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name _;

    location / {
        root /home/ubuntu/${APP_NAME}/dist/public;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    log "Nginx setup complete"
}

# Setup SSL (optional)
setup_ssl() {
    log "Setting up SSL..."
    
    if command -v certbot >/dev/null 2>&1; then
        read -p "Enter your domain name (e.g., example.com): " DOMAIN
        if [ -n "$DOMAIN" ]; then
            sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos --no-eff-email
            log "SSL setup complete"
        else
            warning "Skipping SSL setup - no domain provided"
        fi
    else
        warning "Certbot not found, skipping SSL setup"
    fi
}

# Setup GitHub Actions
setup_github_actions() {
    log "Setting up GitHub Actions..."
    
    # Create GitHub Actions workflow
    mkdir -p .github/workflows
    
    cat > .github/workflows/deploy.yml << EOF
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: \${{ secrets.EC2_HOST }}
        username: \${{ secrets.EC2_USERNAME }}
        key: \${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /home/ubuntu/picktrustdeals
          git pull origin main
          npm ci --production
          npm run build
          pm2 restart picktrustdeals
EOF
    
    log "GitHub Actions workflow created"
}

# Main deployment function
deploy() {
    log "Starting deployment process..."
    
    check_prerequisites
    install_dependencies
    setup_github_cli
    setup_repository
    install_app_dependencies
    build_application
    setup_pm2
    setup_nginx
    setup_ssl
    setup_github_actions
    
    log "Deployment completed successfully!"
    log "Application is now running at http://localhost:3000"
    log "View logs with: pm2 logs picktrustdeals"
}

# Handle script arguments
case "$1" in
    install)
        check_prerequisites
        install_dependencies
        ;;
    setup)
        setup_repository
        install_app_dependencies
        build_application
        setup_pm2
        setup_nginx
        ;;
    deploy)
        deploy
        ;;
    *)
        echo "Usage: $0 {install|setup|deploy}"
        echo "  install  - Install dependencies only"
        echo "  setup    - Setup application only"
        echo "  deploy   - Full deployment"
        exit 1
        ;;
esac
