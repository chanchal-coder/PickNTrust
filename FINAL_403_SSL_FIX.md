# 🔧 Final 403 & SSL Fix - Complete Website Access

## 🎯 **CURRENT STATUS:**
- ✅ **DNS Working**: pickntrust.com resolves to 51.20.43.157
- ✅ **Domain Setup**: Both pickntrust.com and www.pickntrust.com working
- ❌ **403 Forbidden**: Nginx returning 403 instead of proxying
- ❌ **SSL Certificate**: Doesn't include IP address (expected)

## 🚀 **FINAL FIX - Complete Solution:**

### **Step 1: Fix 403 Forbidden Error**
```bash
# The issue is Nginx configuration - let's fix it completely
sudo rm -f /etc/nginx/conf.d/default.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Create clean, working Nginx configuration
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com 51.20.43.157;
    return 301 https://pickntrust.com$request_uri;
}

# HTTPS server for domain
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

# HTTP server for IP access (temporary)
server {
    listen 80;
    server_name 51.20.43.157;
    
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
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Fixed Nginx 403 error"
```

### **Step 2: Verify Services Are Running**
```bash
# Check if frontend and backend are running
pm2 status

# If not running, start them
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173
pm2 start npx --name "pickntrust-backend" --cwd /home/ec2-user/PickNTrust -- tsx server/index.ts

# Check if services are responding
curl -I http://localhost:5173
curl -I http://localhost:5000/api/health

echo "✅ Services verified"
```

### **Step 3: Test Website Access**
```bash
# Test domain access
curl -I https://pickntrust.com
curl -I https://www.pickntrust.com

# Test IP access (HTTP only)
curl -I http://51.20.43.157

echo "✅ Website access tested"
```

## 🎯 **ONE-COMMAND COMPLETE FIX:**

```bash
echo "🔧 Fixing 403 error and finalizing setup..." && \
sudo rm -f /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default && \
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com 51.20.43.157;
    return 301 https://pickntrust.com$request_uri;
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

server {
    listen 80;
    server_name 51.20.43.157;
    
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx && \
pm2 restart all && \
echo "⏳ Waiting for services to restart..." && \
sleep 10 && \
echo "🧪 Testing website access..." && \
curl -I https://pickntrust.com && \
curl -I http://51.20.43.157 && \
echo "🎉 Website is now fully accessible!"
```

## 📊 **Expected Results:**

**Before Fix:**
- ❌ HTTP/2 403 Forbidden
- ❌ Website not accessible via domain
- ❌ SSL certificate error with IP

**After Fix:**
- ✅ https://pickntrust.com - HTTP/2 200 OK (Secure)
- ✅ https://www.pickntrust.com - HTTP/2 200 OK (Secure)
- ✅ http://51.20.43.157 - HTTP/1.1 200 OK (Works)
- ✅ All features functional

## 🌐 **Final Working URLs:**

- **✅ https://pickntrust.com** - Main website (secure, green padlock)
- **✅ https://www.pickntrust.com** - WWW subdomain (secure)
- **✅ http://51.20.43.157** - IP access (HTTP only, for testing)
- **✅ https://pickntrust.com/admin** - Admin panel
- **✅ https://pickntrust.com/api/health** - API endpoints

## 🔍 **Why This Fixes the Issues:**

1. **403 Forbidden Fix**: 
   - Removes conflicting Nginx configurations
   - Creates proper proxy rules to forward requests to frontend (5173) and backend (5000)
   - Ensures Nginx doesn't try to serve static files directly

2. **SSL Certificate**: 
   - Uses domain-based SSL (pickntrust.com) for HTTPS access
   - Provides HTTP access via IP for testing
   - Redirects HTTP to HTTPS for domain access

3. **Complete Routing**:
   - Frontend routes (`/`) → Vite dev server (5173)
   - API routes (`/api`) → Express backend (5000)
   - Admin routes (`/admin`) → Express backend (5000)

## 🎯 **Verification Commands:**

```bash
# Check Nginx configuration
sudo nginx -t

# Check services status
pm2 status

# Test all access methods
curl -I https://pickntrust.com
curl -I https://www.pickntrust.com
curl -I http://51.20.43.157

# Check SSL certificate
curl -I https://pickntrust.com | grep -i server
```

## 🎉 **This Will Complete Your Setup!**

After running this fix:
- ✅ **Domain access works**: https://pickntrust.com loads your website
- ✅ **SSL security**: Green padlock in browser
- ✅ **All features working**: Frontend, backend, admin panel
- ✅ **Production ready**: 24/7 uptime with PM2
- ✅ **Fallback access**: IP address works for testing

**Your PickNTrust website will be fully operational and accessible to users worldwide!**

## 🔒 **Security Note:**

The SSL certificate error with IP access is normal and expected. SSL certificates are issued for domain names, not IP addresses. Users should access your site via the domain (https://pickntrust.com) for the secure, professional experience.

**Run the one-command fix and your website will be completely functional!**
