# 🔧 Path Error Fix - Static Files Issue

## 🎉 Great Progress!
- ✅ Website is now accessible at http://51.20.43.157
- ✅ Nginx is properly proxying to port 5000
- 🔄 Need to fix static file path resolution error

## 🚨 Issue: TypeError [ERR_INVALID_ARG_TYPE]
- **Problem**: `The "paths[0]" argument must be of type string. Received undefined`
- **Location**: `dist/server/index.js:343:36`
- **Root Cause**: Static file path configuration issue

## 🔧 **IMMEDIATE FIX - Environment Variables:**

### **Option 1: Set Missing Environment Variables**
```bash
# Stop PM2
pm2 delete pickntrust

# Set required environment variables and restart
pm2 start dist/server/index.js --name "pickntrust" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --env CLIENT_DIST_PATH="/home/ec2-user/PickNTrust/dist" \
  --env PUBLIC_PATH="/home/ec2-user/PickNTrust/public"

pm2 save
```

### **Option 2: Update Environment File**
```bash
# Add missing paths to .env file
cat >> .env << 'EOF'
CLIENT_DIST_PATH=/home/ec2-user/PickNTrust/dist
PUBLIC_PATH=/home/ec2-user/PickNTrust/public
STATIC_PATH=/home/ec2-user/PickNTrust/public
EOF

# Restart PM2
pm2 restart pickntrust
```

### **Option 3: Check and Create Required Directories**
```bash
# Check if directories exist
ls -la /home/ec2-user/PickNTrust/dist/
ls -la /home/ec2-user/PickNTrust/public/

# If public directory doesn't exist, create it
mkdir -p /home/ec2-user/PickNTrust/public

# Copy built assets if needed
if [ -d "/home/ec2-user/PickNTrust/client/dist" ]; then
  cp -r /home/ec2-user/PickNTrust/client/dist/* /home/ec2-user/PickNTrust/public/
fi

# Restart PM2
pm2 restart pickntrust
```

## 🎯 **Quick One-Command Fix (RECOMMENDED):**

```bash
pm2 delete pickntrust && \
mkdir -p /home/ec2-user/PickNTrust/public && \
pm2 start dist/server/index.js --name "pickntrust" \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --env CLIENT_DIST_PATH="/home/ec2-user/PickNTrust/dist" \
  --env PUBLIC_PATH="/home/ec2-user/PickNTrust/public" && \
pm2 save
```

## 📊 **Verification Commands:**

```bash
# 1. Check PM2 status
pm2 status

# 2. Check PM2 logs for errors
pm2 logs pickntrust --lines 10

# 3. Test the website
curl http://localhost:5000

# 4. Test through Nginx
curl http://51.20.43.157

# 5. Check if directories exist
ls -la /home/ec2-user/PickNTrust/public/
ls -la /home/ec2-user/PickNTrust/dist/
```

## 🔍 **If Still Having Issues:**

### **Check the exact error location:**
```bash
# Look at the specific line causing the error
head -n 350 /home/ec2-user/PickNTrust/dist/server/index.js | tail -n 10
```

### **Alternative: Start with npm (for debugging):**
```bash
pm2 delete pickntrust
cd /home/ec2-user/PickNTrust
NODE_ENV=production PORT=5000 npm start
```

### **Check environment variables:**
```bash
pm2 show pickntrust
```

## 🎯 **Expected Results:**

After the fix:
- PM2 status should show "online"
- `curl http://localhost:5000` should return HTML (not error)
- `curl http://51.20.43.157` should return the website
- Website should load properly at http://51.20.43.157

## 🎊 **Almost There!**

This is a common static file serving issue. The fix involves setting the correct paths for static files and ensuring the directories exist.

**Run the recommended one-command fix above and your website should be fully functional!**

## 🌐 **After Fix - Your Live URLs:**

- **🏠 Main Website**: http://51.20.43.157
- **👨‍💼 Admin Panel**: http://51.20.43.157/admin
- **🔑 Admin Login**: admin / pickntrust2025
