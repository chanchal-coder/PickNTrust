# 🔧 Final Troubleshooting - PM2 Still Erroring

## 🚨 Current Status:
- PM2 starts as "online" but then becomes "errored"
- Need to check the exact error logs to fix the issue

## 🔍 **IMMEDIATE DIAGNOSTIC COMMANDS:**

### **Step 1: Check the exact error**
```bash
pm2 logs pickntrust --lines 50
```

### **Step 2: Check if the built file exists**
```bash
ls -la dist/server/index.js
```

### **Step 3: Try starting the built file directly**
```bash
pm2 delete pickntrust
pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production --env PORT=3000
pm2 save
pm2 status
```

### **Step 4: If built file doesn't exist, rebuild**
```bash
npm run build
ls -la dist/server/
```

### **Step 5: Check package.json start script**
```bash
cat package.json | grep -A 5 -B 5 "start"
```

## 🔧 **ALTERNATIVE FIXES:**

### **Option A: Start with tsx (TypeScript runner)**
```bash
pm2 delete pickntrust
npm install -g tsx
pm2 start server/index.ts --name "pickntrust" --interpreter="node" --interpreter-args="--loader tsx" --env NODE_ENV=production
pm2 save
```

### **Option B: Start with ts-node**
```bash
pm2 delete pickntrust
npm install -g ts-node
pm2 start server/index.ts --name "pickntrust" --interpreter="ts-node" --env NODE_ENV=production
pm2 save
```

### **Option C: Manual node start (for testing)**
```bash
cd /home/ec2-user/PickNTrust
NODE_ENV=production node dist/server/index.js
```

## 🎯 **Most Likely Fixes:**

### **Fix 1: Missing dist/server/index.js**
```bash
# Rebuild the application
npm run build

# Check if build was successful
ls -la dist/server/index.js

# Start with built file
pm2 delete pickntrust
pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production
pm2 save
```

### **Fix 2: Start script issue**
```bash
# Check current start script
grep '"start"' package.json

# If it's still trying to use cross-env, fix it
sed -i 's/"start": "cross-env NODE_ENV=production node dist\/server\/index.js"/"start": "node dist\/server\/index.js"/g' package.json

# Start with environment variable
NODE_ENV=production pm2 start npm --name "pickntrust" -- start
pm2 save
```

### **Fix 3: Direct server start**
```bash
pm2 delete pickntrust
cd /home/ec2-user/PickNTrust
pm2 start server/index.ts --name "pickntrust" --interpreter="node" --interpreter-args="--loader tsx" --env NODE_ENV=production --env PORT=3000
pm2 save
```

## 📊 **Verification Commands:**

```bash
# Check PM2 status
pm2 status

# Check detailed logs
pm2 logs pickntrust

# Check if port 3000 is listening
netstat -tlnp | grep 3000

# Test locally
curl http://localhost:3000
```

## 🎯 **Quick Diagnostic & Fix Sequence:**

```bash
# 1. Check logs first
pm2 logs pickntrust --lines 20

# 2. Try direct built file start
pm2 delete pickntrust && pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production && pm2 save

# 3. If that fails, check if file exists
ls -la dist/server/index.js

# 4. If file doesn't exist, rebuild
npm run build && pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production && pm2 save
```

## 🔍 **Common Issues & Solutions:**

1. **Built file missing**: Run `npm run build`
2. **TypeScript not compiled**: Install `tsx` or `ts-node`
3. **Environment variables**: Set `NODE_ENV=production PORT=3000`
4. **Database connection**: Check if Supabase credentials are correct
5. **Port already in use**: Check `netstat -tlnp | grep 3000`

## 📋 **Next Steps:**

1. **Run the diagnostic commands** to see the exact error
2. **Try the most likely fixes** based on the error
3. **Check if the application starts** with `pm2 status`
4. **Test the website** at http://51.20.43.157

Please run the diagnostic commands first to see the exact error, then we can apply the specific fix needed!
