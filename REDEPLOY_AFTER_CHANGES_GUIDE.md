# PickNTrust Redeployment Guide - After Pulling Latest Changes

## Quick Redeployment Commands

### Option 1: One-Command Update (Recommended)
```bash
# SSH into your EC2 instance and run:
cd /var/www/PickNTrust && ./update-app.sh
```

### Option 2: Manual Step-by-Step Update
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to application directory
cd /var/www/PickNTrust

# Pull latest changes
git pull origin main

# Install any new dependencies
npm ci --only=production

# Rebuild the application
npm run build

# Restart the application
pm2 restart pickntrust

# Check status
pm2 status
```

## Detailed Redeployment Process

### Step 1: Connect to Your EC2 Instance
```bash
# Replace with your actual key file and EC2 IP
ssh -i ~/.ssh/your-key.pem ubuntu@your-ec2-ip-address
```

### Step 2: Navigate to Application Directory
```bash
cd /var/www/PickNTrust
```

### Step 3: Check Current Status
```bash
# Check if application is running
pm2 status

# Check current git status
git status
git log --oneline -5
```

### Step 4: Pull Latest Changes
```bash
# Fetch and pull latest changes from main branch
git fetch origin
git pull origin main

# If you have local changes that conflict:
git stash
git pull origin main
git stash pop  # Only if you want to restore local changes
```

### Step 5: Update Dependencies (if package.json changed)
```bash
# Check if package.json was modified
git diff HEAD~1 package.json

# If package.json changed, update dependencies
npm ci --only=production

# Or if you want to update all dependencies
npm install
```

### Step 6: Rebuild Application
```bash
# Clean previous build (optional but recommended)
rm -rf dist/

# Build the application
npm run build

# Verify build was successful
ls -la dist/public/
```

### Step 7: Database Updates (if schema changed)
```bash
# If database schema was updated, run migrations
npm run db:push

# Or if you have specific migration scripts
# npm run migrate
```

### Step 8: Restart Application
```bash
# Restart the application with PM2
pm2 restart pickntrust

# Or restart all PM2 processes
pm2 restart all

# Check if restart was successful
pm2 status
```

### Step 9: Verify Deployment
```bash
# Check application logs
pm2 logs pickntrust --lines 50

# Test if application is responding
curl -I http://localhost:5000

# Test API endpoints
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/products/featured
```

### Step 10: Test in Browser
```bash
# Get your EC2 public IP
curl -s http://checkip.amazonaws.com

# Then visit in browser:
# http://your-ec2-ip
```

## Automated Update Script

Create this script on your EC2 instance for easy updates:

```bash
# Create the update script (run this once)
cat > /var/www/PickNTrust/update-app.sh << 'EOF'
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Navigate to app directory
cd /var/www/PickNTrust

print_status "Starting PickNTrust application update..."

# Check current status
print_status "Checking current application status..."
pm2 describe pickntrust > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Application is currently running"
else
    print_warning "Application is not running"
fi

# Backup current version (optional)
print_status "Creating backup of current version..."
BACKUP_DIR="/var/backups/pickntrust"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp -r dist $BACKUP_DIR/dist_backup_$DATE 2>/dev/null || true

# Pull latest changes
print_status "Pulling latest changes from repository..."
git fetch origin
if git pull origin main; then
    print_success "Successfully pulled latest changes"
else
    print_error "Failed to pull changes"
    exit 1
fi

# Check if package.json changed
if git diff HEAD~1 --name-only | grep -q "package.json"; then
    print_status "package.json changed, updating dependencies..."
    npm ci --only=production
    print_success "Dependencies updated"
else
    print_status "No dependency changes detected"
fi

# Build application
print_status "Building application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check if database schema changed
if git diff HEAD~1 --name-only | grep -q "schema\|migration"; then
    print_status "Database schema changes detected, running migrations..."
    npm run db:push || true
fi

# Restart application
print_status "Restarting application..."
if pm2 restart pickntrust; then
    print_success "Application restarted successfully"
else
    print_error "Failed to restart application"
    exit 1
fi

# Wait for application to start
sleep 5

# Verify application is running
print_status "Verifying application status..."
if pm2 describe pickntrust | grep -q "online"; then
    print_success "Application is running"
else
    print_error "Application failed to start"
    pm2 logs pickntrust --lines 20
    exit 1
fi

# Test application response
print_status "Testing application response..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200"; then
    print_success "Application is responding correctly"
else
    print_warning "Application may not be responding correctly"
fi

# Show final status
print_status "Final status check..."
pm2 status

print_success "PickNTrust application update completed successfully!"
print_status "You can view logs with: pm2 logs pickntrust"
print_status "Monitor with: pm2 monit"

EOF

# Make script executable
chmod +x /var/www/PickNTrust/update-app.sh
```

## Troubleshooting Common Issues

### Issue 1: Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue 2: Application Won't Start
```bash
# Check PM2 logs
pm2 logs pickntrust

# Check if port is in use
sudo netstat -tulpn | grep :5000

# Kill any processes using port 5000
sudo fuser -k 5000/tcp

# Restart PM2
pm2 restart pickntrust
```

### Issue 3: Database Issues
```bash
# Check database file permissions
ls -la sqlite.db

# Fix permissions if needed
sudo chown ubuntu:ubuntu sqlite.db

# Backup and recreate database if corrupted
cp sqlite.db sqlite.db.backup
rm sqlite.db
npm run db:push
```

### Issue 4: Nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue 5: Memory Issues
```bash
# Check memory usage
free -h
pm2 monit

# Restart PM2 if memory usage is high
pm2 restart pickntrust

# Or restart with memory limit
pm2 restart pickntrust --max-memory-restart 1G
```

## Rollback Process (if update fails)

### Quick Rollback
```bash
# Go back to previous git commit
git log --oneline -5
git reset --hard HEAD~1

# Rebuild with previous version
npm run build
pm2 restart pickntrust
```

### Full Rollback with Backup
```bash
# Stop application
pm2 stop pickntrust

# Restore from backup
BACKUP_DIR="/var/backups/pickntrust"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/dist_backup_* | head -1)
rm -rf dist
cp -r $LATEST_BACKUP dist

# Restart application
pm2 start pickntrust
```

## Monitoring After Update

### Check Application Health
```bash
# Monitor PM2 processes
pm2 monit

# Check logs continuously
pm2 logs pickntrust -f

# Check system resources
htop
df -h
```

### Performance Testing
```bash
# Test response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000

# Create curl-format.txt for detailed timing
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

## Best Practices for Updates

1. **Always backup before updating**
2. **Test in staging environment first** (if available)
3. **Update during low-traffic periods**
4. **Monitor logs after deployment**
5. **Have a rollback plan ready**
6. **Keep dependencies updated regularly**
7. **Use semantic versioning for releases**

## Automated Deployment with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ubuntu
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /var/www/PickNTrust
          ./update-app.sh
```

This will automatically deploy when you push to the main branch!
