# 🔧 Backend Port 5000 Fix - Immediate Solution

## 🎯 **ISSUE IDENTIFIED:**
- ✅ Frontend (5173): Working - `curl http://localhost:5173` returns HTML
- ❌ Backend (5000): Not running - `curl http://localhost:5000/api/health` fails
- ✅ Nginx (80): Running

## 🚀 **IMMEDIATE FIX - Run These Commands:**

### **Step 1: Check PM2 Status**
```bash
pm2 status
pm2 logs
```

### **Step 2: Fix Backend Startup**
```bash
# Stop all PM2 processes
pm2 delete all

# Navigate to project directory
cd /home/ec2-user/PickNTrust

# Check if dist/server/index.js exists
ls -la dist/server/index.js

# If it doesn't exist, build the project
npm run build

# Start backend directly first (to test)
node dist/server/index.js
```

### **Step 3: If Direct Start Fails, Use Alternative Method**
```bash
# Stop the direct process (Ctrl+C)
# Try starting with npm script
npm start
```

### **Step 4: If npm start works, use PM2**
```bash
# Stop npm start (Ctrl+C)
# Start with PM2 using npm
pm2 start npm --name "pickntrust-backend" -- start

# Check status
pm2 status
pm2 logs pickntrust-backend
```

## 🎯 **ONE-COMMAND BACKEND FIX:**

```bash
cd /home/ec2-user/PickNTrust && \
pm2 delete all && \
npm run build && \
pm2 start npm --name "pickntrust-backend" -- start && \
pm2 start npx --name "pickntrust-frontend" -- vite --host 0.0.0.0 --port 5173 && \
pm2 save && \
echo "Waiting 5 seconds..." && \
sleep 5 && \
echo "Testing backend..." && \
curl http://localhost:5000/api/health && \
echo "Testing frontend..." && \
curl -s http://localhost:5173 | head -1
```

## 🔍 **Alternative: Manual Backend Start**

If PM2 continues to fail, start backend manually:

```bash
# Terminal 1: Start backend
cd /home/ec2-user/PickNTrust
npm start

# Terminal 2: Start frontend (if needed)
cd /home/ec2-user/PickNTrust
npx vite --host 0.0.0.0 --port 5173
```

## 📊 **Verification Commands:**

```bash
# Check if both ports are listening
netstat -tlnp | grep -E ':(5000|5173)'

# Test backend
curl http://localhost:5000/api/health

# Test frontend
curl -s http://localhost:5173 | head -1

# Check PM2 status
pm2 status
```

## 🎯 **Expected Results:**

After the fix:
```bash
# netstat should show:
tcp        0      0 0.0.0.0:5000            0.0.0.0:*               LISTEN      [PID]/node
tcp        0      0 0.0.0.0:5173            0.0.0.0:*               LISTEN      [PID]/node

# curl tests should work:
curl http://localhost:5000/api/health  # Should return JSON
curl http://localhost:5173             # Should return HTML
```

## 🚨 **If Backend Still Won't Start:**

### **Check for Build Issues:**
```bash
# Check if build completed successfully
ls -la dist/server/
cat dist/server/index.js | head -10

# Check for TypeScript errors
npm run check
```

### **Check Package.json Scripts:**
```bash
# Verify start script
cat package.json | grep -A 5 '"scripts"'
```

### **Manual Debug:**
```bash
# Try running the built file directly
cd /home/ec2-user/PickNTrust
NODE_ENV=production PORT=5000 node dist/server/index.js
```

## 🎉 **Quick Success Path:**

Most likely the issue is that the backend PM2 process failed to start. The one-command fix above should resolve it by:

1. Rebuilding the project
2. Starting backend with `npm start` via PM2
3. Starting frontend with direct vite command
4. Testing both services

**Run the one-command fix and your backend should be accessible on port 5000!**
