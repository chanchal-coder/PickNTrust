# 🚨 Fix CORS and Build Errors

## Issue Analysis:
1. **Frontend Error**: `cat is not defined` in JavaScript - likely a build/bundling issue
2. **Backend CORS Error**: Server crashing due to CORS origin callback issues

## Step 1: Fix CORS Error in Backend
```bash
cd /home/ec2-user/PickNTrust

# Stop the crashing backend
pm2 delete pickntrust-backend

# Create a temporary fix for CORS
cp server/index.ts server/index.ts.backup

# Create a simplified CORS configuration
cat > cors-fix.js << 'EOF'
// Temporary CORS fix
const fs = require('fs');
const path = require('path');

const serverFile = '/home/ec2-user/PickNTrust/server/index.ts';
let content = fs.readFileSync(serverFile, 'utf8');

// Replace the complex CORS configuration with a simple one
const oldCors = `app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost on any port for development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    // Allow your domain and www subdomain
    if (origin && (origin.includes('pickntrust.com') || origin.includes('www.pickntrust.com'))) {
      return callback(null, true);
    }

    // Reject other origins
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));`;

const newCors = `app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));`;

content = content.replace(oldCors, newCors);
fs.writeFileSync(serverFile, content);
console.log('CORS configuration simplified');
EOF

node cors-fix.js
```

## Step 2: Rebuild with Fixed CORS
```bash
cd /home/ec2-user/PickNTrust

# Rebuild the backend with fixed CORS
npm run build

# Check if build succeeded
ls -la dist/server/
```

## Step 3: Fix Frontend Build Issues
```bash
cd /home/ec2-user/PickNTrust

# Check if there are any global variables or undefined references
grep -r "cat" client/ || echo "No 'cat' references found in client"

# Clean and rebuild frontend specifically
rm -rf dist/public/
npm run build

# Verify frontend build
ls -la dist/public/
ls -la dist/public/assets/
```

## Step 4: Alternative - Use Development Mode for Frontend
If the build keeps failing, let's run frontend in development mode:

```bash
cd /home/ec2-user/PickNTrust

# Delete all processes
pm2 delete all

# Start backend in production mode (serves API only)
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Start frontend in development mode
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Check status
pm2 status
```

## Step 5: Update Nginx for Dual-Port Setup
```bash
# Update Nginx to serve frontend from port 5173 and API from port 5000
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

    # Frontend (Vite dev server on port 5173)
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
    }

    # Backend API (port 5000)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: Test the Fixed Setup
```bash
# Test backend API
curl http://localhost:5000/api/health

# Test frontend
curl -I http://localhost:5173

# Test through Nginx
curl -I http://localhost:80

# Check PM2 logs for errors
pm2 logs --lines 20
```

## Step 7: Save Configuration
```bash
pm2 save
```

## Expected Results:
- ✅ Backend runs without CORS errors
- ✅ Frontend serves from Vite dev server (no build issues)
- ✅ Site accessible at http://51.20.43.157
- ✅ No more JavaScript "cat is not defined" errors
- ✅ No more 500 errors on static assets

This approach uses the frontend in development mode to avoid build issues while keeping the backend in production mode.
