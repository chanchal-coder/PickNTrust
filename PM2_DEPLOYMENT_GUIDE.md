# 🚀 PM2 Deployment Guide for PickNTrust

## ✅ **Your Project is Perfect for PM2!**

Your PickNTrust project is ideal for PM2 deployment because:
- ✅ Node.js/Express backend with SQLite database
- ✅ React frontend with Vite dev server
- ✅ Dual-port setup (Frontend: 5173, Backend: 5000)
- ✅ Existing PM2 configuration files
- ✅ Production-ready build process

## 🔧 **Dual-Port PM2 Configuration**

Your ecosystem.config.cjs is configured for optimal dual-port deployment:

### **Dual-Port Configuration (ecosystem.config.cjs)**
```javascript
module.exports = {
  apps: [
    {
      name: 'pickntrust-backend',
      script: 'dist/server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'file:./sqlite.db'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'pickntrust-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './client',
      env: {
        NODE_ENV: 'development',
        PORT: 5173,
        VITE_API_URL: 'http://localhost:5000'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

## 🌐 **Port Configuration**
- **Frontend (Vite Dev Server):** http://localhost:5173
- **Backend (Express API):** http://localhost:5000
- **Admin Panel:** http://localhost:5173/admin

## 📋 **Complete Deployment Steps**

### **Step 1: Prepare Your Server**
```bash
# Install PM2 globally
npm install -g pm2

# Create logs directory
mkdir -p logs

# Install dependencies
npm install
```

### **Step 2: Build Your Application**
```bash
# Build frontend and backend
npm run build

# Verify build output
ls -la dist/
ls -la dist/public/
ls -la dist/server/
```

### **Step 3: Initialize Database**
```bash
# Push database schema
npm run db:push

# Add categories (run our fix script)
chmod +x fix-deployment.sh
./fix-deployment.sh
```

### **Step 4: Deploy with PM2 (Dual-Port Setup)**
```bash
# Start both frontend and backend
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### **Step 5: Verify Deployment**
```bash
# Check PM2 status
pm2 status

# View logs for both services
pm2 logs pickntrust-backend
pm2 logs pickntrust-frontend

# Monitor in real-time
pm2 monit

# Test both services
curl http://localhost:5000/api/categories  # Backend
curl http://localhost:5173                 # Frontend
```

## 🚀 **Quick Deploy Script**

Use the automated deployment script:
```bash
# Make script executable and run
chmod +x pm2-deploy.sh
./pm2-deploy.sh
```

This script will:
- Install dependencies
- Build the backend
- Initialize database with 36+ categories
- Start both frontend (5173) and backend (5000) with PM2
- Verify deployment

## 🔍 **PM2 Management Commands**

```bash
# Application Management
pm2 start ecosystem.config.cjs     # Start app
pm2 stop pickntrust-app            # Stop app
pm2 restart pickntrust-app         # Restart app
pm2 reload pickntrust-app          # Graceful reload
pm2 delete pickntrust-app          # Delete app

# Monitoring
pm2 status                         # Show all apps
pm2 logs pickntrust-app           # Show logs
pm2 logs pickntrust-app --lines 100  # Show last 100 lines
pm2 monit                         # Real-time monitoring

# Process Management
pm2 save                          # Save current processes
pm2 resurrect                     # Restore saved processes
pm2 startup                       # Generate startup script
```

## 🌐 **Nginx Configuration (Optional)**

If you want to use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files directly
    location / {
        root /path/to/pickntrust/dist/public;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js
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
```

## 🚨 **Troubleshooting**

### **Common Issues & Solutions:**

1. **App won't start:**
   ```bash
   pm2 logs pickntrust-app
   # Check for missing dependencies or build issues
   ```

2. **Database errors:**
   ```bash
   # Ensure database file exists and has proper permissions
   ls -la sqlite.db
   chmod 664 sqlite.db
   ```

3. **Frontend not loading:**
   ```bash
   # Verify build output
   ls -la dist/public/index.html
   # Rebuild if missing
   npm run build
   ```

4. **Port conflicts:**
   ```bash
   # Check what's using port 5000
   lsof -i :5000
   # Kill conflicting processes or change port
   ```

## 📊 **Monitoring & Logs**

### **Log Locations:**
- **Application logs:** `./logs/combined.log`
- **Error logs:** `./logs/err.log`
- **Output logs:** `./logs/out.log`
- **PM2 logs:** `~/.pm2/logs/`

### **Health Checks:**
```bash
# Check if app is responding
curl http://localhost:5000/api/categories

# Check frontend
curl http://localhost:5000/

# Monitor resource usage
pm2 monit
```

## 🔄 **Deployment Updates**

When you need to update your application:

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies (if any)
npm install

# 3. Rebuild application
npm run build

# 4. Restart PM2 app
pm2 restart pickntrust-app

# 5. Verify deployment
pm2 logs pickntrust-app --lines 50
```

## ✅ **Why PM2 is Perfect for Your Project**

1. **Process Management:** Keeps your app running 24/7
2. **Auto-restart:** Automatically restarts if app crashes
3. **Log Management:** Centralized logging with rotation
4. **Monitoring:** Built-in monitoring and metrics
5. **Zero-downtime:** Graceful reloads without stopping service
6. **Startup Scripts:** Automatically starts on server boot
7. **Memory Management:** Prevents memory leaks with restart limits
8. **Simple Deployment:** Single command deployment and management

Your PickNTrust project is perfectly suited for PM2 deployment! 🎉
