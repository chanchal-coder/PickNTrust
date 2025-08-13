# 🔥 COMPLETE FINAL FIX - Cat Error + CORS Issues

## The Problems:
1. **Frontend**: "cat is not defined" error still in JavaScript build
2. **Backend**: CORS crashes preventing proper serving

## Step 1: Fix App.tsx Completely
```bash
cd /home/ec2-user/PickNTrust

# Stop all processes
pm2 delete all

# Check what's actually in App.tsx
head -10 client/src/App.tsx

# If it still has the cat command, completely recreate it
cat > client/src/App.tsx << 'EOF'
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Home from "@/pages/home";
import Category from "@/pages/category";
import Admin from "@/pages/admin";
import Wishlist from "@/pages/wishlist";
import BlogPost from "@/pages/blog-post";
import HowItWorks from "@/pages/how-it-works";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import Search from "@/pages/search";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WishlistProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/category/:category" component={Category} />
            <Route path="/admin" component={Admin} />
            <Route path="/wishlist" component={Wishlist} />
            <Route path="/blog/:slug" component={BlogPost} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/search" component={Search} />
            <Route>404 - Page Not Found</Route>
          </Switch>
          <Toaster />
        </div>
      </WishlistProvider>
    </QueryClientProvider>
  );
}

export default App;
EOF
```

## Step 2: Fix CORS in Server
```bash
cd /home/ec2-user/PickNTrust

# Create a simple CORS fix
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

node fix-cors-simple.cjs
```

## Step 3: Clean Rebuild Everything
```bash
cd /home/ec2-user/PickNTrust

# Clean everything
rm -rf dist/
rm -rf node_modules/.cache/
npm cache clean --force

# Rebuild
npm run build

# Check if new assets are created
ls -la dist/public/assets/
```

## Step 4: Start Backend with Simple Method
```bash
cd /home/ec2-user/PickNTrust

# Create a super simple server starter
cat > simple-start.js << 'EOF'
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

// Simple CORS override
const express = require('express');
const originalUse = express.application.use;

express.application.use = function(path, ...args) {
  if (typeof path === 'function' && path.name === 'corsMiddleware') {
    // Replace CORS middleware with simple version
    return originalUse.call(this, (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }
  return originalUse.call(this, path, ...args);
};

// Start the server
require('./dist/server/index.js');
EOF

# Start with simple method
pm2 start simple-start.js --name "pickntrust-backend"

# Check status
pm2 status
pm2 logs pickntrust-backend --lines 5
```

## Step 5: Test Everything
```bash
# Test API
curl http://localhost:5000/api/health

# Test main page
curl -I http://localhost:5000/

# Test new assets (check the actual filenames)
ls -la dist/public/assets/
# Then test with actual filenames, e.g.:
curl -I http://localhost:5000/assets/style-XXXXX.css
```

## Step 6: If Still Not Working, Use Nginx + Frontend Dev Server
```bash
cd /home/ec2-user/PickNTrust

# Stop everything
pm2 delete all

# Start backend API only (no frontend serving)
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-api"

# Start frontend dev server
pm2 start npx --name "pickntrust-frontend" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Update Nginx to serve frontend from 5173
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

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
}
EOF

sudo systemctl restart nginx
```

## Expected Results:
- ✅ No more "cat is not defined" errors
- ✅ No more CORS crashes
- ✅ Site works at http://51.20.43.157

This approach fixes both the frontend JavaScript corruption and backend CORS issues.
