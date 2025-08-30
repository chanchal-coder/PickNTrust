# 🔒 SSL Certificate Expand Fix - Add www subdomain

## 🎯 **ISSUE IDENTIFIED:**
- ✅ You already have SSL for `pickntrust.com`
- ❌ Need to expand certificate to include `www.pickntrust.com`
- ❌ Certbot asking for confirmation to expand

## 🚀 **IMMEDIATE FIX:**

### **Step 1: Expand Existing Certificate**
```bash
# Expand the existing certificate to include www subdomain
sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com --expand --non-interactive --agree-tos

# If that fails, use force renewal
sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com --expand --force-renewal --non-interactive --agree-tos
```

### **Step 2: Fix Nginx Configuration**
```bash
# Remove conflicting server blocks first
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/conf.d/default.conf

# Create clean Nginx config
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
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/pickntrust.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pickntrust.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy settings
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
    
    # API routes
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin routes
    location /admin {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 3: Update Vite Config for Domain**
```bash
cd /home/ec2-user/PickNTrust

# Update vite.config.ts to allow your domain
cp vite.config.ts vite.config.ts.backup

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

# Restart frontend with new config
pm2 restart pickntrust-frontend
```

## 🎯 **ONE-COMMAND COMPLETE FIX:**

```bash
echo "🔒 Expanding SSL certificate..." && \
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf && \
sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com --expand --force-renewal --non-interactive --agree-tos && \
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pickntrust.com www.pickntrust.com;
    
    ssl_certificate /etc/letsencrypt/live/pickntrust.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pickntrust.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
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
    }
    
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /admin {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx && \
cd /home/ec2-user/PickNTrust && \
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
pm2 restart pickntrust-frontend && \
echo "🎉 SSL certificate expanded! Testing..." && \
sleep 5 && \
curl -I https://www.pickntrust.com && \
curl -I https://pickntrust.com && \
echo "✅ Both domains now have SSL!"
```

## 📊 **Verification Commands:**

```bash
# 1. Check SSL certificate includes both domains
sudo certbot certificates

# 2. Test both domains
curl -I https://pickntrust.com
curl -I https://www.pickntrust.com

# 3. Check Nginx config
sudo nginx -t

# 4. Check PM2 status
pm2 status
```

## 🎯 **Expected Results:**

**Before Fix:**
- ✅ https://pickntrust.com (works)
- ❌ https://www.pickntrust.com (certificate error)

**After Fix:**
- ✅ https://pickntrust.com (secure 🔒)
- ✅ https://www.pickntrust.com (secure 🔒)
- ✅ Both redirect HTTP to HTTPS
- ✅ No domain blocking errors

## 🔍 **If SSL Expansion Still Fails:**

### **Alternative Method:**
```bash
# Delete existing certificate and create new one
sudo certbot delete --cert-name pickntrust.com

# Create fresh certificate with both domains
sudo certbot --nginx -d pickntrust.com -d www.pickntrust.com --non-interactive --agree-tos --email sharmachanchalcvp@gmail.com
```

### **Manual Certificate Check:**
```bash
# Check what certificates exist
sudo ls -la /etc/letsencrypt/live/

# Check certificate details
sudo openssl x509 -in /etc/letsencrypt/live/pickntrust.com/fullchain.pem -text -noout | grep DNS
```

## 🎉 **This Will Fix Your SSL Issue!**

The problem is that your existing certificate only covers `pickntrust.com` but you need it to also cover `www.pickntrust.com`. The `--expand` flag tells Certbot to add the www subdomain to your existing certificate.

**Run the one-command fix and both your domains will have SSL certificates!**

## 🌐 **Final Working URLs:**

- **🔒 https://pickntrust.com** - Main domain (secure)
- **🔒 https://www.pickntrust.com** - WWW subdomain (secure)
- **🔒 https://www.pickntrust.com/admin** - Admin panel (secure)

Both will show the green padlock 🔒 in the address bar!
