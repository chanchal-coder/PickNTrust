# 🚀 DIRECT FIX COMMANDS - Copy & Paste

You're in the wrong directory. Here are the exact commands to run:

## Step 1: Go to Project Root and Fix CORS
```bash
cd /home/ec2-user/PickNTrust

# Create the CORS fix script in the right location
cat > fix-cors-simple.cjs << 'EOF'
const fs = require('fs');

const serverFile = '/home/ec2-user/PickNTrust/server/index.ts';
let content = fs.readFileSync(serverFile, 'utf8');

// Replace any CORS configuration with a simple one
const corsLines = content.split('\n');
const newLines = [];
let inCorsBlock = false;
let corsReplaced = false;

for (let i = 0; i < corsLines.length; i++) {
  const line = corsLines[i];
  
  if (line.includes('app.use(cors({') && !corsReplaced) {
    // Start of CORS block
    inCorsBlock = true;
    newLines.push('app.use(cors({');
    newLines.push('  origin: true,');
    newLines.push('  credentials: true');
    newLines.push('}));');
    corsReplaced = true;
    continue;
  }
  
  if (inCorsBlock) {
    if (line.includes('}));')) {
      inCorsBlock = false;
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(serverFile, newLines.join('\n'));
console.log('✅ CORS fixed');
EOF

# Run the CORS fix
node fix-cors-simple.cjs
```

## Step 2: Clean Rebuild
```bash
cd /home/ec2-user/PickNTrust

# Stop all PM2 processes
pm2 delete all

# Clean build
rm -rf dist/
npm run build

# Check if build succeeded
ls -la dist/public/assets/
```

## Step 3: Start Backend Simply
```bash
cd /home/ec2-user/PickNTrust

# Start backend in production mode
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check status
pm2 status
pm2 logs pickntrust-backend --lines 5
```

## Step 4: Test the Site
```bash
# Test API
curl http://localhost:5000/api/health

# Test main page
curl -I http://localhost:5000/

# Check what assets were built
ls -la dist/public/assets/

# Test the actual asset files (use the real filenames from above)
curl -I http://localhost:5000/assets/[ACTUAL_CSS_FILENAME]
```

## Step 5: If Still Having Issues, Use Dev Server Method
```bash
cd /home/ec2-user/PickNTrust

# Stop all
pm2 delete all

# Start backend API only
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-api"

# Start frontend dev server
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Check both are running
pm2 status
```

## Step 6: Save Configuration
```bash
# Only after everything is working
pm2 save
```

## Access Your Site:
- **Main Site**: http://51.20.43.157
- **Admin Panel**: http://51.20.43.157/admin

Make sure you're in `/home/ec2-user/PickNTrust` directory when running these commands!
