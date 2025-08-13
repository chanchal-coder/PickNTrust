# 🧹 CLEANUP AND FINAL DEPLOYMENT

## Step 1: Clean Up Unnecessary Files
```bash
cd /home/ec2-user/PickNTrust

# Remove all the unnecessary deployment scripts and guides
rm -f *.md *.sh *.cjs cors-fix.js deploy_now.sh monitor.sh
rm -f app.py simple_app.py run_flask.py test_extractor.py pyproject.toml uv.lock
rm -f *.log server.pid nohup.out
rm -f railway.json vercel.json replit.md
rm -f picktrust-key.pem.txt

# Keep only essential project files
echo "✅ Cleaned up unnecessary files"
```

## Step 2: Fix CORS and Rebuild
```bash
cd /home/ec2-user/PickNTrust

# Stop all PM2 processes
pm2 delete all

# Simple CORS fix directly in server file
sed -i 's/origin: function (origin, callback) {[^}]*}/origin: true/g' server/index.ts

# Clean rebuild
rm -rf dist/
npm run build

# Check build success
ls -la dist/public/assets/
```

## Step 3: Start Backend
```bash
cd /home/ec2-user/PickNTrust

# Start backend in production mode
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check status
pm2 status
pm2 logs pickntrust-backend --lines 5
```

## Step 4: Test the Application
```bash
# Test API
curl http://localhost:5000/api/health

# Test main page
curl -I http://localhost:5000/

# Test static assets (use actual filenames from build)
ls -la dist/public/assets/
```

## Step 5: Configure Nginx (Optional)
```bash
# Only if you want to use port 80
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## Step 6: Save Configuration
```bash
# Save PM2 config
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

## Access Your Site:
- **Direct Backend**: http://51.20.43.157:5000
- **Via Nginx**: http://51.20.43.157 (if configured)
- **Admin Panel**: http://51.20.43.157/admin

## Essential Files Kept:
- `package.json` - Dependencies
- `client/` - Frontend code
- `server/` - Backend code
- `dist/` - Built application
- `node_modules/` - Dependencies
- `public/`, `shared/`, `migrations/` - App assets
- Configuration files: `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, etc.

All unnecessary deployment scripts and guides have been removed!
