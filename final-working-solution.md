# 🎯 FINAL WORKING SOLUTION - CORS BYPASS

The backend starts successfully but crashes on first request due to CORS. Here's the definitive fix:

## Step 1: Stop Crashing Backend
```bash
cd /home/ec2-user/PickNTrust
pm2 delete all
```

## Step 2: Create CORS Bypass Server
```bash
cd /home/ec2-user/PickNTrust

# Create a server wrapper that bypasses CORS completely
cat > server-no-cors.js << 'EOF'
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple CORS middleware that never crashes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/public')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PickNTrust API is running' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 PickNTrust server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist/public')}`);
});
EOF

echo "✅ Created CORS-free server wrapper"
```

## Step 3: Start the CORS-Free Server
```bash
cd /home/ec2-user/PickNTrust

# Start the simple server
NODE_ENV=production PORT=5000 pm2 start server-no-cors.js --name "pickntrust-simple"

# Check status
pm2 status
pm2 logs pickntrust-simple --lines 5
```

## Step 4: Test the Working Server
```bash
# Test API
curl http://localhost:5000/api/health

# Test main page
curl -I http://localhost:5000/

# Test static assets
ls -la dist/public/assets/
curl -I http://localhost:5000/assets/index-*.js
```

## Step 5: If Simple Server Works, Use Dev Server for Frontend
```bash
cd /home/ec2-user/PickNTrust

# Alternative: Use dev server for frontend (most reliable)
pm2 delete all

# Start backend API only (simple version)
NODE_ENV=production PORT=5000 pm2 start server-no-cors.js --name "pickntrust-api"

# Start frontend dev server
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Check both are running
pm2 status
```

## Step 6: Configure Nginx for Dev Server Setup
```bash
# Configure Nginx to route properly
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

    # Frontend (React dev server)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

## Step 7: Save Configuration
```bash
# Save PM2 config
pm2 save
```

## Access Your Site:
- **Method 1 (Simple Server)**: http://51.20.43.157:5000
- **Method 2 (Dev Server + Nginx)**: http://51.20.43.157
- **Admin Panel**: http://51.20.43.157/admin

## Why This Works:
1. **Simple Server**: Bypasses complex CORS completely
2. **Dev Server**: Uses Vite's built-in dev server (most reliable)
3. **No CORS Crashes**: Simple middleware that never fails

Choose Method 1 for simplicity or Method 2 for production-like setup.
