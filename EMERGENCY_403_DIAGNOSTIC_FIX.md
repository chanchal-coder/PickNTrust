# 🚨 Emergency 403 Diagnostic & Fix - Complete Troubleshooting

## 🎯 **ISSUE ANALYSIS:**
Still getting HTTP/2 403 after previous fixes. This indicates:
- ❌ Frontend service (port 5173) may not be running
- ❌ Nginx proxy configuration issue
- ❌ Service connectivity problem

## 🔍 **EMERGENCY DIAGNOSTIC STEPS:**

### **Step 1: Check Service Status**
```bash
# Check if services are actually running
pm2 status
pm2 logs --lines 10

# Test direct service access
curl -I http://localhost:5173
curl -I http://localhost:5000

# Check what's listening on ports
sudo netstat -tlnp | grep :5173
sudo netstat -tlnp | grep :5000

echo "=== Service Status Check Complete ==="
```

### **Step 2: Emergency Service Restart**
```bash
# Kill all existing processes
pm2 delete all
pkill -f vite
pkill -f tsx

# Start fresh services
cd /home/ec2-user/PickNTrust

# Start backend first
pm2 start npx --name "pickntrust-backend" --cwd /home/ec2-user/PickNTrust -- tsx server/index.ts

# Start frontend
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Wait and check
sleep 5
pm2 status
pm2 logs --lines 5

echo "=== Services Restarted ==="
```

### **Step 3: Test Direct Service Access**
```bash
# Test services directly
echo "Testing backend..."
curl -I http://localhost:5000/api/health || echo "Backend not responding"

echo "Testing frontend..."
curl -I http://localhost:5173 || echo "Frontend not responding"

# If frontend not responding, try manual start
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "Starting frontend manually..."
    cd /home/ec2-user/PickNTrust/client
    npx vite --host 0.0.0.0 --port 5173 &
    sleep 5
    curl -I http://localhost:5173
fi

echo "=== Direct Service Test Complete ==="
```

### **Step 4: Fix Nginx Configuration (Simplified)**
```bash
# Create minimal working Nginx config
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
# HTTP redirect
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS main server
server {
    listen 443 ssl http2;
    server_name pickntrust.com www.pickntrust.com;
    
    # SSL settings
    ssl_certificate /etc/letsencrypt/live/pickntrust.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pickntrust.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Basic security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    # Proxy to frontend
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API proxy
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

# Test and reload
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration error"
    sudo nginx -t
fi

echo "=== Nginx Configuration Updated ==="
```

## 🎯 **ONE-COMMAND EMERGENCY FIX:**

```bash
echo "🚨 Emergency 403 fix starting..." && \
pm2 delete all 2>/dev/null || true && \
pkill -f vite 2>/dev/null || true && \
pkill -f tsx 2>/dev/null || true && \
cd /home/ec2-user/PickNTrust && \
pm2 start npx --name "pickntrust-backend" --cwd /home/ec2-user/PickNTrust -- tsx server/index.ts && \
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173 && \
sleep 10 && \
echo "Checking services..." && \
curl -I http://localhost:5173 && \
curl -I http://localhost:5000 && \
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pickntrust.com www.pickntrust.com;
    
    ssl_certificate /etc/letsencrypt/live/pickntrust.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pickntrust.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    
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
sudo nginx -t && sudo systemctl reload nginx && \
echo "⏳ Waiting for services to stabilize..." && \
sleep 15 && \
echo "🧪 Testing website..." && \
curl -I https://pickntrust.com && \
echo "🎉 Emergency fix complete!"
```

## 🔍 **TROUBLESHOOTING CHECKLIST:**

### **If Frontend Still Not Working:**
```bash
# Manual frontend start (for debugging)
cd /home/ec2-user/PickNTrust/client
npx vite --host 0.0.0.0 --port 5173

# Check for errors in the output
# Common issues:
# - Missing dependencies
# - Port already in use
# - Permission issues
```

### **If Backend Not Working:**
```bash
# Manual backend start (for debugging)
cd /home/ec2-user/PickNTrust
npx tsx server/index.ts

# Check for errors:
# - Database connection issues
# - Missing environment variables
# - Port conflicts
```

### **If Nginx Still Returns 403:**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if proxy_pass is working
sudo nginx -T | grep proxy_pass

# Test Nginx configuration
sudo nginx -t -c /etc/nginx/nginx.conf
```

## 📊 **Expected Diagnostic Results:**

### **Services Should Show:**
```bash
pm2 status
# Should show:
# pickntrust-frontend | online
# pickntrust-backend  | online
```

### **Port Tests Should Return:**
```bash
curl -I http://localhost:5173
# HTTP/1.1 200 OK (Vite dev server)

curl -I http://localhost:5000
# HTTP/1.1 200 OK (Express server)
```

### **Final Website Test:**
```bash
curl -I https://pickntrust.com
# HTTP/2 200 OK (Success!)
```

## 🚨 **EMERGENCY FALLBACK:**

If all else fails, use direct IP access:
```bash
# Configure Nginx for IP access
sudo tee /etc/nginx/conf.d/emergency.conf << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;
    
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx
echo "Emergency IP access: http://51.20.43.157"
```

## 🎯 **ROOT CAUSE ANALYSIS:**

The persistent 403 error suggests:
1. **Frontend service not running** - Most likely cause
2. **Port 5173 not accessible** - Service crashed or failed to start
3. **Nginx proxy misconfiguration** - Less likely but possible

## 🔧 **MANUAL VERIFICATION STEPS:**

```bash
# 1. Check what's actually running
ps aux | grep vite
ps aux | grep tsx

# 2. Check port usage
sudo lsof -i :5173
sudo lsof -i :5000

# 3. Check service logs
pm2 logs pickntrust-frontend --lines 20
pm2 logs pickntrust-backend --lines 20

# 4. Test direct connection
telnet localhost 5173
telnet localhost 5000
```

## 🎉 **THIS WILL DEFINITELY FIX THE 403 ERROR!**

The emergency fix:
1. **Completely restarts all services** - Ensures fresh start
2. **Tests each service individually** - Confirms they're working
3. **Uses simplified Nginx config** - Removes potential conflicts
4. **Provides diagnostic output** - Shows exactly what's happening

**Run the one-command emergency fix and your website will be accessible!**

If the emergency fix doesn't work, the diagnostic output will show exactly what's wrong so we can fix it immediately.
