#!/bin/bash
# Database Synchronization Script
# Copies local SQLite database to production server

set -e

# Configuration
EC2_IP="51.20.43.157"
KEY_PATH="C:/AWSKeys/picktrust-key.pem"
EC2_USER="ec2-user"
LOCAL_DB="sqlite.db"
REMOTE_PATH="/home/ec2-user/PickNTrust/"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Database Synchronization Script${NC}"
echo -e "${BLUE}Copying local SQLite database to production...${NC}"

# Check if local database exists
if [ ! -f "$LOCAL_DB" ]; then
    echo -e "${RED}❌ Local database file '$LOCAL_DB' not found!${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📤 Uploading database to production server...${NC}"

# Stop the application first
echo -e "${YELLOW}⏸️ Stopping application on production...${NC}"
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" "cd PickNTrust && pm2 stop pickntrust || true"

# Copy database file
echo -e "${YELLOW}📋 Copying database file...${NC}"
scp -i "$KEY_PATH" "$LOCAL_DB" "$EC2_USER@$EC2_IP:$REMOTE_PATH$LOCAL_DB"

# Restart the application
echo -e "${YELLOW}🔄 Restarting application...${NC}"
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" "cd PickNTrust && pm2 start pickntrust"

echo -e "${GREEN}✅ Database synchronization completed!${NC}"
echo -e "${GREEN}🌐 Your production app now uses the same data as local${NC}"
echo -e "${BLUE}💡 Visit http://51.20.43.157 to verify the changes${NC}"