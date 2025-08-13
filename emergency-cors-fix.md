# 🚨 EMERGENCY CORS FIX - Backend Crashing

## The Problem
Backend is crashing due to CORS origin callback error at line 1306 in dist/server/index.js

## Step 1: Stop the Crashing Backend
```bash
cd /home/ec2-user/PickNTrust
pm2 delete all
```

## Step 2: Fix CORS in Source Code
```bash
cd /home/ec2-user/PickNTrust

# Backup the original server file
cp server/index.ts server/index.ts.backup

# Create a simple CORS fix script
cat > fix-cors.cjs << 'EOF'
const fs = require('fs');

const serverFile = '/home/ec2-user/PickNTrust/server/index.ts';
let content = fs.readFileSync(serverFile, 'utf8');

// Find and replace the complex CORS configuration
const corsRegex = /app\.use\(cors\(\{[\s\S]*?\}\)\);/;

const simpleCors = `app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));`;

content = content.replace(corsRegex, simpleCors);

fs.writeFileSync(serverFile, content);
console.log('✅ CORS configuration simplified');
EOF

# Run the fix
node fix-cors.cjs
```

## Step 3: Rebuild with Fixed CORS
```bash
cd /home/ec2-user/PickNTrust

# Rebuild the server
npm run build

# Check if build succeeded
ls -la dist/server/index.js
```

## Step 4: Start Backend with Fixed CORS
```bash
cd /home/ec2-user/PickNTrust

# Start backend
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check status immediately
pm2 status

# Check logs for any errors
pm2 logs pickntrust-backend --lines 5
```

## Step 5: Test if Backend is Working
```bash
# Test API endpoint
curl http://localhost:5000/api/health

# Test main page
curl -I http://localhost:5000/

# Test static assets
curl -I http://localhost:5000/assets/style-BPw7ZUrs.css
```

## Step 6: If Still Crashing, Use Alternative Method
```bash
cd /home/ec2-user/PickNTrust

# Stop PM2
pm2 delete all

# Create a simple server wrapper
cat > start-server.js << 'EOF'
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

// Override CORS before importing the server
const originalCors = require('cors');
require.cache[require.resolve('cors')] = {
  exports: () => (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
};

// Now import and start the server
require('./dist/server/index.js');
EOF

# Start with the wrapper
pm2 start start-server.js --name "pickntrust-backend"
```

## Step 7: Save Configuration
```bash
# Only after backend is running without errors
pm2 save
```

## Expected Results:
- ✅ No more CORS crashes
- ✅ Backend runs stable on port 5000
- ✅ Site accessible at http://51.20.43.157
- ✅ No more origin callback errors

The CORS configuration is too complex and causing crashes. This fix simplifies it to work reliably.
