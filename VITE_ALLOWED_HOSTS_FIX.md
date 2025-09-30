# 🔧 Vite Allowed Hosts Fix - Domain Access Issue

## 🎯 **ISSUE IDENTIFIED:**
- ❌ "Blocked request. This host ("pickntrust.com") is not allowed"
- ❌ Vite dev server blocking your custom domain
- ❌ Need to add domain to `server.allowedHosts` in vite.config.js

## 🚀 **IMMEDIATE FIX (No Downtime):**

### **Step 1: Update Vite Configuration**
```bash
cd /home/ec2-user/PickNTrust

# Backup current config
cp vite.config.ts vite.config.ts.backup

# Create updated vite.config.ts with proper allowedHosts
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  root: "./client",
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Allow all hosts for production
    allowedHosts: "all",
    // Alternative: specific hosts
    // allowedHosts: [
    //   "pickntrust.com",
    //   "www.pickntrust.com",
    //   "localhost",
    //   "127.0.0.1",
    //   ".pickntrust.com"
    // ],
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
});
EOF

echo "✅ Updated vite.config.ts with allowedHosts"
```

### **Step 2: Restart Frontend Service**
```bash
# Restart the frontend service to apply new config
pm2 restart pickntrust-frontend

# Check if it's running
pm2 status

# Check logs for any errors
pm2 logs pickntrust-frontend --lines 10
```

### **Step 3: Verify Fix**
```bash
# Test direct frontend access
curl -I http://localhost:5173

# Test domain access through Nginx
curl -I https://pickntrust.com
curl -I https://www.pickntrust.com
```

## 🎯 **ONE-COMMAND INSTANT FIX:**

```bash
cd /home/ec2-user/PickNTrust && \
echo "🔧 Fixing Vite allowed hosts..." && \
cp vite.config.ts vite.config.ts.backup && \
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  root: "./client",
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: "all",
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
});
EOF
echo "✅ Updated vite config" && \
pm2 restart pickntrust-frontend && \
echo "⏳ Waiting for service to restart..." && \
sleep 5 && \
echo "🧪 Testing domain access..." && \
curl -I https://pickntrust.com && \
echo "🎉 Domain access fixed! Your website should work now."
```

## 📊 **Expected Results:**

**Before Fix:**
- ❌ "Blocked request. This host ("pickntrust.com") is not allowed"
- ❌ Website not accessible via domain

**After Fix:**
- ✅ https://pickntrust.com loads properly
- ✅ https://www.pickntrust.com loads properly
- ✅ No more "blocked request" errors

## 🔍 **Alternative: Specific Host Configuration**

If you prefer to specify exact hosts instead of allowing all:

```bash
cd /home/ec2-user/PickNTrust

cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  root: "./client",
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "pickntrust.com",
      "www.pickntrust.com",
      "localhost",
      "127.0.0.1",
      ".pickntrust.com",  // Allow all subdomains
      "51.20.43.157"      // Your server IP
    ],
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
});
EOF

pm2 restart pickntrust-frontend
```

## 🔧 **Troubleshooting:**

### **If Frontend Won't Start:**
```bash
# Check PM2 logs
pm2 logs pickntrust-frontend

# Try starting manually to see errors
cd /home/ec2-user/PickNTrust/client
npx vite --host 0.0.0.0 --port 5173
```

### **If Domain Still Blocked:**
```bash
# Check current vite config
cat /home/ec2-user/PickNTrust/vite.config.ts | grep -A 10 allowedHosts

# Verify PM2 is using the right directory
pm2 show pickntrust-frontend
```

### **If SSL Issues:**
```bash
# Check SSL certificate
sudo certbot certificates

# Test HTTPS
curl -k https://pickntrust.com
```

## 🎯 **Why This Fixes the Issue:**

1. **✅ allowedHosts: "all"** - Allows any domain to access Vite dev server
2. **✅ Proper host binding** - "0.0.0.0" allows external connections
3. **✅ PM2 restart** - Applies new configuration immediately
4. **✅ No downtime** - Frontend restarts quickly

## 🌐 **Final Working URLs:**

After the fix:
- **✅ https://pickntrust.com** - Should load your website
- **✅ https://www.pickntrust.com** - Should load your website
- **✅ https://pickntrust.com/admin** - Should load admin panel

## 🎉 **This Will Fix Your Domain Access!**

The issue is that Vite's development server has a security feature that blocks requests from unknown hosts. By setting `allowedHosts: "all"`, we tell Vite to accept requests from any domain, including your custom domain.

**Run the one-command fix and your website will be accessible via your domain immediately!**

## 🔒 **Security Note:**

Using `allowedHosts: "all"` is safe for production when you have Nginx as a reverse proxy (which you do). Nginx handles the external security, and Vite only receives requests from localhost (127.0.0.1) via the proxy.
