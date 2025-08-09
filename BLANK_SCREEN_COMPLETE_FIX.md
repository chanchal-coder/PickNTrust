# 🔧 Blank White Screen Fix - Complete Solution

## 🎯 **BLANK SCREEN ROOT CAUSES:**
1. **Nginx not proxying correctly** to frontend (5173)
2. **Frontend not building/serving properly**
3. **CORS issues** between frontend and backend
4. **Missing client build** or incorrect paths

## 🚀 **IMMEDIATE DIAGNOSTIC COMMANDS:**

### **Step 1: Check What's Actually Running**
```bash
# Check PM2 status
pm2 status

# Check what's on each port
curl -I http://localhost:5173
curl -I http://localhost:5000
curl -I http://localhost:80

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log &
sudo tail -f /var/log/nginx/access.log &

# Test direct access
curl -s http://YOUR_SERVER_IP:5173 | head -10
curl -s http://YOUR_SERVER_IP:5000 | head -10
```

### **Step 2: Check Browser Developer Tools**
Open browser developer tools (F12) and check:
- **Console tab**: Look for JavaScript errors
- **Network tab**: See what requests are failing
- **Sources tab**: Check if files are loading

## 🔧 **COMPLETE BLANK SCREEN FIX:**

### **Fix 1: Ensure Frontend is Actually Built and Running**
```bash
cd /home/ec2-user/PickNTrust

# Stop all processes
pm2 delete all

# Check if client directory exists and has proper structure
ls -la client/
ls -la client/src/

# Install client dependencies if missing
cd client
npm install
cd ..

# Start frontend manually first to test
cd client
npx vite --host 0.0.0.0 --port 5173 &
VITE_PID=$!

# Test if frontend is working
sleep 5
curl -s http://localhost:5173 | head -10

# Kill the test process
kill $VITE_PID
cd ..
```

### **Fix 2: Update Nginx Configuration for Proper Proxying**
```bash
# Create proper Nginx config that handles both services
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Increase buffer sizes for large responses
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # Frontend routes (everything except /api and /admin)
    location / {
        # Try frontend first, fallback to backend
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support for Vite HMR
        proxy_set_header Connection "upgrade";
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # If frontend fails, try backend
        error_page 502 503 504 = @backend;
    }
    
    # Backend fallback
    location @backend {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API routes directly to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin routes to backend
    location /admin {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### **Fix 3: Start Services in Correct Order**
```bash
cd /home/ec2-user/PickNTrust

# Ensure we have the right working directory
pwd

# Start backend first
pm2 start dist/server/index.js --name "pickntrust-backend" --env NODE_ENV=development --env PORT=5000

# Start frontend with proper working directory
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Save PM2 config
pm2 save

# Check status
pm2 status
pm2 logs --lines 5
```

## 🎯 **ONE-COMMAND COMPLETE BLANK SCREEN FIX:**

```bash
cd /home/ec2-user/PickNTrust && \
echo "🔧 Fixing blank screen issue..." && \
pm2 delete all && \
echo "📦 Installing client dependencies..." && \
cd client && npm install && cd .. && \
echo "🌐 Updating Nginx config..." && \
sudo tee /etc/nginx/conf.d/pickntrust.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    location / {
        proxy_pass http://localhost:5173;
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
        error_page 502 503 504 = @backend;
    }
    
    location @backend {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /admin {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx && \
echo "🚀 Starting services..." && \
pm2 start dist/server/index.js --name "pickntrust-backend" --env NODE_ENV=development --env PORT=5000 && \
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173 && \
pm2 save && \
echo "⏳ Waiting for services to start..." && \
sleep 10 && \
echo "🧪 Testing services..." && \
echo "Backend test:" && \
curl -s http://localhost:5000/api/health || echo "Backend not responding" && \
echo "Frontend test:" && \
curl -s http://localhost:5173 | head -1 || echo "Frontend not responding" && \
echo "✅ Setup complete! Check your website now."
```

## 📊 **Verification Steps:**

```bash
# 1. Check PM2 status (both should be "online")
pm2 status

# 2. Check ports are listening
netstat -tlnp | grep -E ':(80|5000|5173)'

# 3. Test each service individually
curl -I http://localhost:5173  # Should return 200 OK
curl -I http://localhost:5000  # Should return 200 OK
curl -I http://localhost:80    # Should return 200 OK

# 4. Check Nginx is working
sudo nginx -t
sudo systemctl status nginx

# 5. Test the actual website
curl -s http://YOUR_SERVER_IP | head -10
```

## 🎯 **Expected Results After Fix:**

- ✅ **PM2 Status**: Both processes show as "online"
- ✅ **Frontend (5173)**: Returns HTML content
- ✅ **Backend (5000)**: Returns API responses
- ✅ **Nginx (80)**: Properly proxies to frontend
- ✅ **Website**: Shows actual PickNTrust content, not blank screen

## 🔍 **If Still Blank Screen:**

### **Check Browser Developer Tools:**
1. **F12 → Console**: Look for JavaScript errors
2. **F12 → Network**: Check if requests are failing (red entries)
3. **F12 → Sources**: Verify files are loading

### **Common Issues:**
- **CORS errors**: Backend rejecting frontend requests
- **404 errors**: Frontend files not found
- **JavaScript errors**: React app failing to mount
- **Proxy errors**: Nginx not routing correctly

### **Manual Debug:**
```bash
# Test direct frontend access
curl -v http://YOUR_SERVER_IP:5173

# Check PM2 logs for errors
pm2 logs pickntrust-frontend --lines 20
pm2 logs pickntrust-backend --lines 20

# Check Nginx logs
sudo tail -20 /var/log/nginx/error.log
```

## 🎉 **This Should Fix the Blank Screen!**

The issue is likely that Nginx isn't properly proxying to your frontend on port 5173, or the frontend isn't starting correctly. This fix ensures:

1. ✅ **Frontend dependencies installed**
2. ✅ **Proper Nginx proxying configuration**
3. ✅ **Services start in correct order**
4. ✅ **Fallback mechanisms in place**

**Run the one-command fix and your PickNTrust website should display properly!**
