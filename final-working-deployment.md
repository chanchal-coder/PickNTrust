# 🚀 Final Working Deployment - Step by Step

## Current Issues:
1. Backend not starting properly (blank white page on port 5000)
2. Trying to access pickntrust.com instead of IP address
3. Need to start the backend correctly

## Step 1: Start Backend Properly
```bash
cd /home/ec2-user/PickNTrust

# Check current PM2 status
pm2 status

# Delete all existing processes
pm2 delete all

# Start backend in production mode with explicit environment
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend" --env NODE_ENV=production --env PORT=5000

# Check if it started
pm2 status
pm2 logs pickntrust-backend --lines 10
```

## Step 2: Test Backend Locally
```bash
# Test if backend is serving the React app
curl -I http://localhost:5000/

# Test if backend serves static assets with new filenames
curl -I http://localhost:5000/assets/style-BPw7ZUrs.css
curl -I http://localhost:5000/assets/index-Blk_p2Up.js

# Test API endpoint
curl http://localhost:5000/api/health
```

## Step 3: If Backend Still Not Working, Start Manually First
```bash
cd /home/ec2-user/PickNTrust

# Stop PM2
pm2 delete all

# Test manually first to see errors
NODE_ENV=production PORT=5000 node dist/server/index.js

# If it works manually, then start with PM2
# Press Ctrl+C to stop manual mode, then:
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"
```

## Step 4: Configure Nginx (if needed)
```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

    location / {
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

# Enable and restart Nginx
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Test Your Application
```bash
# Test backend directly
curl http://localhost:5000/

# Test through Nginx
curl http://localhost:80/

# Check what's running on ports
sudo netstat -tlnp | grep -E ':(80|5000)'
```

## Step 6: Access Your Site
**IMPORTANT**: Use the IP address, not the domain:

- ✅ **Correct**: http://51.20.43.157
- ❌ **Wrong**: http://pickntrust.com (this won't work without DNS setup)

## Step 7: Save PM2 Configuration
```bash
# Only after everything is working
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
# Run the sudo command that PM2 outputs
```

## Troubleshooting Commands:
```bash
# Check PM2 status
pm2 status

# Check PM2 logs for errors
pm2 logs pickntrust-backend

# Check if port 5000 is in use
sudo netstat -tlnp | grep :5000

# Check Nginx status
sudo systemctl status nginx

# Restart everything if needed
pm2 restart all
sudo systemctl restart nginx
```

## Expected Working URLs:
- **Main Site**: http://51.20.43.157 (NOT pickntrust.com)
- **Admin Panel**: http://51.20.43.157/admin
- **API Health**: http://51.20.43.157/api/health

The key is to use the IP address (51.20.43.157) instead of the domain name (pickntrust.com) since DNS isn't configured.
