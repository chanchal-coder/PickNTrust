# 🔧 PickNTrust Deployment Troubleshooting Guide

Based on the errors you encountered, here are the specific fixes:

## 🚨 Issues Identified:

### 1. **Node.js Version Incompatibility**
- **Problem**: Node.js 18.20.8 is too old for `better-sqlite3@12.2.0` and `cross-env@10.0.0`
- **Required**: Node.js 20.x or higher
- **Fix**: Upgrade to Node.js 20

### 2. **Missing Build Tools**
- **Problem**: `gyp ERR! not found: make` - missing build tools for native modules
- **Fix**: Install development tools and Python

### 3. **Build Process Failure**
- **Problem**: `vite: command not found` - build tools not properly installed
- **Fix**: Clean install with proper dependencies

### 4. **PM2 Process Management Issues**
- **Problem**: `Script not found: /home/ec2-user/PickNTrust/server.js`
- **Fix**: Use correct entry point for PM2

## 🔧 **IMMEDIATE FIX - Run These Commands:**

### **Step 1: Copy the Fix Script to EC2**
```bash
# On your EC2 instance, create the fix script:
cat > fix-deployment.sh << 'SCRIPT_END'
#!/bin/bash
set -e

echo "🔧 Fixing PickNTrust deployment issues..."

cd /home/ec2-user/PickNTrust

# Install build dependencies
echo "📦 Installing build dependencies..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3-devel

# Update to Node.js 20
echo "📦 Updating Node.js to version 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

echo "✅ Node.js version: $(node --version)"

# Clean and reinstall
echo "🧹 Cleaning and reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Build application
echo "🔨 Building application..."
npm run build

# Create environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
ENVEOF

# Fix PM2 process
echo "🔄 Starting application with PM2..."
pm2 delete all 2>/dev/null || true

# Try different entry points
if [ -f "dist/server/index.js" ]; then
    pm2 start dist/server/index.js --name "pickntrust"
elif [ -f "server/index.js" ]; then
    pm2 start server/index.js --name "pickntrust"
else
    pm2 start npm --name "pickntrust" -- start
fi

pm2 save

# Configure Nginx
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name 51.20.43.157;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Fix completed! Check http://51.20.43.157"
SCRIPT_END
```

### **Step 2: Run the Fix Script**
```bash
chmod +x fix-deployment.sh
./fix-deployment.sh
```

## 🔧 **Alternative Quick Fix Commands:**

If the script approach doesn't work, run these commands one by one:

```bash
# 1. Install build tools
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3-devel

# 2. Update Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 3. Clean and reinstall
cd /home/ec2-user/PickNTrust
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# 4. Build
npm run build

# 5. Start with PM2
pm2 delete all 2>/dev/null || true
pm2 start npm --name "pickntrust" -- start
pm2 save

# 6. Configure Nginx
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo systemctl restart nginx
```

## 📊 **Verification Commands:**

After running the fix, verify everything is working:

```bash
# Check Node.js version (should be 20.x)
node --version

# Check PM2 status
pm2 status

# Check if app is listening on port 3000
netstat -tlnp | grep 3000

# Check Nginx status
sudo systemctl status nginx

# Test the application
curl http://localhost:3000
```

## 🌐 **Expected Results:**

After successful fix:
- **🏠 Main Website**: http://51.20.43.157
- **👨‍💼 Admin Panel**: http://51.20.43.157/admin
- **🔑 Admin Login**: admin / pickntrust2025

## 🔍 **If Issues Persist:**

1. **Check PM2 logs**: `pm2 logs pickntrust`
2. **Check Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
3. **Check if port 3000 is blocked**: `sudo netstat -tlnp | grep 3000`
4. **Restart services**: `pm2 restart pickntrust && sudo systemctl restart nginx`

## 📋 **Common Error Solutions:**

### **"better-sqlite3" build fails:**
```bash
sudo yum install -y gcc-c++ make python3-devel
npm rebuild better-sqlite3
```

### **"vite: command not found":**
```bash
npm install -g vite
# OR
npx vite build
```

### **PM2 process not starting:**
```bash
pm2 start "npm start" --name pickntrust
# OR
pm2 start server/index.js --name pickntrust
```

The main issue was Node.js version compatibility. Once you upgrade to Node.js 20 and install build tools, everything should work smoothly!
