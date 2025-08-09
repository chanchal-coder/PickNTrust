# 🌐 Domain + SSL + 24/7 Uptime Complete Fix

## 🎯 **ISSUES TO FIX:**
1. **❌ "Not Secure"** - No SSL certificate (HTTPS)
2. **❌ Domain blocked** - Vite not allowing www.pickntrust.com
3. **❌ Website stops** - When you close terminal/command
4. **❌ Not 24/7** - Need persistent service

## 🚀 **COMPLETE SOLUTION (Zero Downtime):**

### **Step 1: Fix Domain Access (Vite Configuration)**
```bash
cd /home/ec2-user/PickNTrust

# Backup current vite config
cp vite.config.ts vite.config.ts.backup

# Update vite.config.ts to allow your domain
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
    // Allow your domain
    allowedHosts: [
      "pickntrust.com",
      "www.pickntrust.com",
      "localhost",
      ".pickntrust.com"  // Allow all subdomains
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

echo "✅ Updated vite.config.ts with domain allowlist"
```

### **Step 2: Install SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot for SSL
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate for your domain
sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com --non-interactive --agree-tos --email your-email@example.com

# Verify SSL certificate
sudo certbot certificates
```

### **Step 3: Update Nginx for HTTPS + Domain**
```bash
# Create production Nginx config with SSL
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pickntrust.com www.pickntrust.com;
    
    # SSL Configuration (Certbot will add these)
    ssl_certificate /etc/letsencrypt/live/pickntrust.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pickntrust.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Increase buffer sizes
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # Frontend routes
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API routes to backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin routes to backend
    location /admin {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 4: Setup 24/7 Service (PM2 + Auto-restart)**
```bash
# Restart frontend with new config
pm2 delete pickntrust-frontend
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Configure PM2 for 24/7 operation
pm2 save
pm2 startup

# Enable auto-restart on crashes
pm2 set pm2:autodump true
pm2 set pm2:watch true

# Set up log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

echo "✅ PM2 configured for 24/7 operation"
```

### **Step 5: Setup Auto SSL Renewal**
```bash
# Add SSL renewal to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# Test SSL renewal
sudo certbot renew --dry-run
```

## 🎯 **ONE-COMMAND COMPLETE FIX:**

```bash
cd /home/ec2-user/PickNTrust && \
echo "🔧 Fixing domain, SSL, and 24/7 uptime..." && \
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
    allowedHosts: [
      "pickntrust.com",
      "www.pickntrust.com",
      "localhost",
      ".pickntrust.com"
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
echo "✅ Updated vite config" && \
sudo yum install -y certbot python3-certbot-nginx && \
echo "📧 Enter your email for SSL certificate:" && \
read EMAIL && \
sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com --non-interactive --agree-tos --email $EMAIL && \
pm2 delete pickntrust-frontend && \
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173 && \
pm2 save && \
pm2 startup && \
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab - && \
echo "🎉 Complete! Your website is now:"
echo "✅ Secure (HTTPS)"
echo "✅ Domain accessible (www.pickntrust.com)"
echo "✅ Running 24/7"
echo "✅ Auto SSL renewal"
```

## 📊 **Verification Commands:**

```bash
# 1. Check SSL certificate
curl -I https://www.pickntrust.com

# 2. Check domain access
curl -I https://pickntrust.com

# 3. Check PM2 status
pm2 status

# 4. Check Nginx SSL config
sudo nginx -t

# 5. Test SSL renewal
sudo certbot renew --dry-run
```

## 🎯 **Expected Results:**

**Before Fix:**
- ❌ http://your-ip (Not Secure)
- ❌ Domain blocked error
- ❌ Website stops when terminal closes

**After Fix:**
- ✅ https://www.pickntrust.com (Secure 🔒)
- ✅ https://pickntrust.com (Secure 🔒)
- ✅ Website runs 24/7 automatically
- ✅ Auto SSL renewal every 3 months

## 🔧 **24/7 Uptime Features:**

1. **✅ PM2 Process Manager** - Automatically restarts if crashes
2. **✅ System Startup** - Starts automatically when server reboots
3. **✅ Log Rotation** - Prevents disk space issues
4. **✅ Auto SSL Renewal** - Certificate renews automatically
5. **✅ Health Monitoring** - PM2 monitors process health

## 🌐 **Final URLs:**

- **🔒 Main Website**: https://www.pickntrust.com
- **🔒 Alternative**: https://pickntrust.com  
- **🔒 Admin Panel**: https://www.pickntrust.com/admin
- **🔒 API Health**: https://www.pickntrust.com/api/health

## 🎉 **Benefits After Fix:**

1. **✅ Professional Look** - Green padlock, secure connection
2. **✅ SEO Friendly** - HTTPS is required for good SEO
3. **✅ Always Online** - Runs 24/7 even when you're offline
4. **✅ Auto Recovery** - Restarts automatically if crashes
5. **✅ Domain Access** - Works with your custom domain
6. **✅ SSL Security** - Encrypted connections

## 🔍 **Troubleshooting:**

### **If SSL fails:**
```bash
# Check DNS settings
nslookup pickntrust.com
nslookup www.pickntrust.com

# Manual SSL setup
sudo certbot certonly --standalone -d pickntrust.com -d www.pickntrust.com
```

### **If domain still blocked:**
```bash
# Check vite config
cat vite.config.ts | grep allowedHosts

# Restart frontend
pm2 restart pickntrust-frontend
```

### **If website stops:**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Restart services
pm2 restart all
```

## 🎊 **You're Now Production Ready!**

After running this fix:
- ✅ **Professional HTTPS website**
- ✅ **Custom domain working**  
- ✅ **24/7 automatic uptime**
- ✅ **Auto SSL renewal**
- ✅ **Production-grade setup**

**Run the one-command fix and your PickNTrust website will be fully production-ready with HTTPS, custom domain, and 24/7 uptime!**
