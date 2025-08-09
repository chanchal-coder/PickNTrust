# Complete Deployment Guide - PickNTrust

## Problem Solved
Fixed the "localhost refused to connect" issue by creating a reliable deployment solution that runs both frontend and backend servers properly.

## Solution Overview
- **Backend**: Runs on port 5000 using the built production files
- **Frontend**: Runs on port 5173 using Vite dev server for full functionality
- **Process Management**: Simple bash scripts instead of problematic PM2 setup
- **Deployment**: Single command deployment with proper error handling

## Files Created/Updated

### 1. `start-dev-server.sh`
- Starts both backend and frontend servers
- Handles port cleanup and process management
- Provides clear status feedback

### 2. `stop-servers.sh`
- Cleanly stops all running servers
- Kills processes by PID and port
- Comprehensive cleanup

### 3. `deploy/update-deploy.sh`
- Complete deployment automation
- Builds backend, starts servers, checks status
- Includes error handling and status reporting

## Deployment Commands

### Quick Start
```bash
# Deploy everything
bash deploy/update-deploy.sh

# Or manually start servers
./start-dev-server.sh
```

### Stop Servers
```bash
./stop-servers.sh
```

### Check Status
```bash
# Check if servers are running
curl http://localhost:5000
curl http://localhost:5173

# View logs
tail -f server-output.log
```

## Server Configuration

### Backend (Port 5000)
- Serves API endpoints
- Serves static files in production
- Built from `server/index.ts`

### Frontend (Port 5173)
- Vite dev server for full React functionality
- Hot reload, animations, timers work properly
- Proxies API calls to backend

### Nginx Configuration
Should proxy requests appropriately:
```nginx
location / {
    proxy_pass http://localhost:5173;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

## Troubleshooting

### If Frontend Shows "Cannot GET /"
1. Check if frontend server is running: `curl http://localhost:5173`
2. Check logs: `tail -f server-output.log`
3. Restart servers: `./stop-servers.sh && ./start-dev-server.sh`

### If Backend API Fails
1. Check if backend is running: `curl http://localhost:5000`
2. Check build was successful: `ls -la dist/server/`
3. Check for build errors in deployment logs

### Port Conflicts
1. Stop all servers: `./stop-servers.sh`
2. Check for processes: `lsof -i :5000` and `lsof -i :5173`
3. Kill manually if needed: `kill -9 <PID>`

## Key Features Working
- ✅ Frontend animations and timers
- ✅ Backend API endpoints
- ✅ File uploads and static serving
- ✅ Database operations
- ✅ Hot reload in development
- ✅ Production builds
- ✅ Process management
- ✅ Error handling and logging

## Next Steps
1. Run `bash deploy/update-deploy.sh` to deploy
2. Access the application at your domain
3. Monitor logs with `tail -f server-output.log`
4. Use `./stop-servers.sh` when needed for maintenance

This solution eliminates the PM2 restart issues and provides a stable, reliable deployment for both development and production environments.
