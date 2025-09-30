# 🔧 Final Fix: Missing Build Files Issue

The problem is that `dist/public/` doesn't exist, which means the build process didn't complete properly.

## Step 1: Rebuild the Project Properly
```bash
cd /home/ec2-user/PickNTrust

# Clean previous build
rm -rf dist/

# Rebuild everything
npm run build

# Check if build succeeded
ls -la dist/
ls -la dist/public/
ls -la dist/public/assets/
```

## Step 2: If Build Fails, Check Node Version
```bash
# Check current Node version
node --version

# If it's v18, you need v20+ for better-sqlite3
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo yum install -y nodejs

# Verify new version
node --version
npm --version
```

## Step 3: Reinstall Dependencies and Rebuild
```bash
cd /home/ec2-user/PickNTrust

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Build again
npm run build

# Verify build output
ls -la dist/public/assets/
```

## Step 4: Start Backend in Production Mode
```bash
# Make sure we're in the right directory
cd /home/ec2-user/PickNTrust

# Delete all PM2 processes
pm2 delete all

# Start backend in production mode (this will serve the built React app)
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check status
pm2 status
pm2 logs pickntrust-backend --lines 10
```

## Step 5: Test Static File Serving
```bash
# Test if backend serves the main React app
curl -I http://localhost:5000/

# Test if backend serves static assets
curl -I http://localhost:5000/assets/style-Clbwe4xK.css
curl -I http://localhost:5000/assets/index-BnS10Zvs.js

# Should return 200 OK, not 500 errors
```

## Step 6: Save PM2 Configuration
```bash
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
# Run the sudo command that PM2 outputs
```

## Expected Results After Fix:
- ✅ `dist/public/` directory exists with built React files
- ✅ `dist/public/assets/` contains CSS and JS files
- ✅ Backend serves React app at http://51.20.43.157
- ✅ No more 500 errors on static assets
- ✅ No more white page - full PickNTrust app loads

## If Build Still Fails:
```bash
# Check build errors
npm run build 2>&1 | tee build.log
cat build.log

# Try building with more memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

The key issue is that your build process didn't create the `dist/public/` directory with the React app's static files, so the backend has nothing to serve!
