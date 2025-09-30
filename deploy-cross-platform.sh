#!/bin/bash
# Cross-Platform Deployment Script for PickNTrust
# Works on both Windows (Git Bash/WSL) and Linux EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 PickNTrust Cross-Platform Deployment${NC}"
echo -e "${BLUE}Building and deploying application...${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required dependencies
echo -e "${YELLOW}📋 Checking dependencies...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies check passed${NC}"

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf dist/
rm -rf node_modules/.cache/ 2>/dev/null || true

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --silent

# Build client (Vite)
echo -e "${YELLOW}🔨 Building client application...${NC}"
npm run build:client

if [ ! -d "dist/public" ]; then
    echo -e "${RED}❌ Client build failed - dist/public directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Client build completed${NC}"

# Build server (esbuild)
echo -e "${YELLOW}🔨 Building server application...${NC}"
npm run build:server

if [ ! -f "dist/server/index.js" ]; then
    echo -e "${RED}❌ Server build failed - dist/server/index.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Server build completed${NC}"

# Create production environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️ Creating production environment file...${NC}"
    cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
INTERNAL_API_KEY=pickntrust_internal_2025

# Telegram Bot Tokens (Optional)
CLICK_PICKS_BOT_TOKEN=
VALUE_PICKS_BOT_TOKEN=
PRIME_PICKS_BOT_TOKEN=
CUE_PICKS_BOT_TOKEN=
DEALSHUB_BOT_TOKEN=
LOOT_BOX_BOT_TOKEN=
GLOBAL_PICKS_BOT_TOKEN=
TRAVEL_PICKS_BOT_TOKEN=

# Telegram Channel IDs (Optional)
CLICK_PICKS_CHANNEL_ID=
VALUE_PICKS_CHANNEL_ID=
PRIME_PICKS_CHANNEL_ID=
CUE_PICKS_CHANNEL_ID=
DEALSHUB_CHANNEL_ID=
LOOT_BOX_CHANNEL_ID=
GLOBAL_PICKS_CHANNEL_ID=
TRAVEL_PICKS_CHANNEL_ID=
EOF
    echo -e "${GREEN}✅ Environment file created${NC}"
fi

# Set proper permissions for SQLite database and uploads
echo -e "${YELLOW}🔐 Setting file permissions...${NC}"
mkdir -p uploads/
chmod 755 uploads/ 2>/dev/null || true
chmod 644 sqlite.db 2>/dev/null || true
chmod 644 .env 2>/dev/null || true

# Verify build structure
echo -e "${YELLOW}🔍 Verifying build structure...${NC}"
if [ -d "dist/public" ] && [ -f "dist/server/index.js" ]; then
    echo -e "${GREEN}✅ Build structure verified${NC}"
    echo -e "${BLUE}📁 Client files: $(find dist/public -type f | wc -l) files${NC}"
    echo -e "${BLUE}📁 Server bundle: $(ls -lh dist/server/index.js | awk '{print $5}')${NC}"
else
    echo -e "${RED}❌ Build structure verification failed${NC}"
    exit 1
fi

# Check if PM2 is available (for production deployment)
if command_exists pm2; then
    echo -e "${YELLOW}🔄 Managing PM2 process...${NC}"
    pm2 delete pickntrust 2>/dev/null || true
    pm2 start dist/server/index.js --name "pickntrust"
    pm2 save
    echo -e "${GREEN}✅ PM2 process started${NC}"
else
    echo -e "${YELLOW}⚠️ PM2 not found, starting with Node.js directly...${NC}"
    echo -e "${BLUE}To start the server: NODE_ENV=production node dist/server/index.js${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📝 Build Summary:${NC}"
echo -e "${BLUE}   • Client: Built with Vite to dist/public${NC}"
echo -e "${BLUE}   • Server: Built with esbuild to dist/server${NC}"
echo -e "${BLUE}   • Environment: Production configuration ready${NC}"
echo -e "${BLUE}   • Database: SQLite permissions configured${NC}"

if command_exists pm2; then
    echo -e "${BLUE}   • Process: Running with PM2${NC}"
    echo -e "${BLUE}🌐 Application should be available at: http://localhost:5000${NC}"
else
    echo -e "${BLUE}   • Process: Ready to start with Node.js${NC}"
    echo -e "${BLUE}🌐 To start: NODE_ENV=production node dist/server/index.js${NC}"
fi