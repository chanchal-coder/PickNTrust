# Localhost Connection Fix Guide

## Problem
- `localhost refused to connect` error
- `502 Bad Gateway` from nginx
- Frontend and backend servers not starting properly

## Root Causes Identified
1. **PM2 Process Issues** - Frontend process restarting 400+ times
2. **Build Path Problems** - Vite outputs to `dist/public/` but scripts expect `dist/client/`
3. **Port Conflicts** - Processes not properly cleaned up
4. **Nginx Proxy Issues** - Backend not responding to nginx proxy requests

## Complete Solution

### Step 1: Use the Connection Fix Script
```bash
./fix-connection-issue.sh
```

This script will:
- Kill all existing processes on ports 5000 and 5173
- Clean build artifacts
- Build frontend and backend properly
- Start both servers with proper logging
- Test connectivity

### Step 2: Manual Server Startup (Alternative)
If the script doesn't work, start servers manually:

```bash
# Clean everything
pm2 delete all
sudo fuser -k 5000/tcp
sudo fuser -k 5173/tcp
rm -rf dist/ node_modules/.vite/

# Install and build
npm install
npx vite build
npm run build

# Start backend
NODE_ENV=production node dist/server/index.js &

# Start frontend (in another terminal)
npm run dev
```

### Step 3: Test Connectivity
```bash
./test-server.sh
```

### Step 4: Nginx Configuration
If using nginx, ensure your config points to the correct ports:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### If Backend Won't Start
1. Check logs: `tail -f backend.log`
2. Try development mode: `npm run dev`
3. Check for port conflicts: `netstat -tlnp | grep 5000`

### If Frontend Won't Start
1. Check logs: `tail -f frontend.log`
2. Clear Vite cache: `rm -rf node_modules/.vite/`
3. Check for port conflicts: `netstat -tlnp | grep 5173`

### If Build Fails
1. Check Vite config: `cat vite.config.ts`
2. Ensure output directory exists: `ls -la dist/`
3. Check for CSS syntax errors in stylesheets

### If 502 Bad Gateway Persists
1. Restart nginx: `sudo systemctl restart nginx`
2. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify backend is responding: `curl http://localhost:5000`

## Expected Results
- Backend running on http://localhost:5000
- Frontend running on http://localhost:5173
- Both servers responding to requests
- No 502 errors from nginx
- No PM2 restart loops

## Files Created
- `fix-connection-issue.sh` - Comprehensive fix script
- `test-server.sh` - Server connectivity testing
- `build-frontend.sh` - Proper frontend build process
- `start-dev-server.sh` - Reliable server startup
- `stop-servers.sh` - Clean server shutdown

## Usage Commands
```bash
# Fix connection issues
./fix-connection-issue.sh

# Test servers
./test-server.sh

# Stop all servers
./stop-servers.sh

# Start servers manually
./start-dev-server.sh
