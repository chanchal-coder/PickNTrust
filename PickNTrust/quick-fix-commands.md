# 🚀 Quick Fix for PickNTrust Deployment Issues

Run these commands on your EC2 instance to fix the white page and 500 errors:

## Step 1: Fix Backend to Serve Static Files
```bash
cd /home/ec2-user/PickNTrust

# Stop all PM2 processes
pm2 delete all

# Check if build files exist
ls -la dist/public/

# Start backend in proper production mode
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check if it's working
pm2 status
pm2 logs pickntrust-backend --lines 10
```

## Step 2: Test Backend Static File Serving
```bash
# Test if backend serves the main page
curl -I http://localhost:5000/

# Test if backend serves static assets
curl -I http://localhost:5000/assets/style-Clbwe4xK.css
curl -I http://localhost:5000/assets/index-BnS10Zvs.js
```

## Step 3: Update Nginx Configuration
```bash
# Create proper Nginx config
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

# Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Step 4: Open AWS Security Group Ports
1. Go to AWS Console → EC2 → Security Groups
2. Find your instance's security group
3. Add these inbound rules:
   - **HTTP**: Port 80, Source: 0.0.0.0/0
   - **Custom TCP**: Port 5000, Source: 0.0.0.0/0

## Step 5: Test Your Site
```bash
# Test locally
curl http://localhost:5000/
curl http://localhost:80/

# Check what's running
sudo netstat -tlnp | grep -E ':(80|5000)'
pm2 status
```

## Step 6: Save PM2 Configuration
```bash
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
# Run the sudo command that PM2 outputs
```

## If Still Having Issues:

### Check PM2 Logs:
```bash
pm2 logs pickntrust-backend
```

### Check if Static Files Exist:
```bash
ls -la /home/ec2-user/PickNTrust/dist/public/
ls -la /home/ec2-user/PickNTrust/dist/public/assets/
```

### Manual Test:
```bash
# Test backend directly
cd /home/ec2-user/PickNTrust
NODE_ENV=production PORT=5000 node dist/server/index.js
```

## Expected Results:
- ✅ Backend serves React app at http://51.20.43.157
- ✅ Static assets load without 500 errors
- ✅ No more white page
- ✅ Admin panel accessible at http://51.20.43.157/admin

The key issue was that your backend wasn't running in production mode, so it wasn't serving the built static files from the `dist/public` directory.
