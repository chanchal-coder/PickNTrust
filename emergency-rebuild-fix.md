# 🚨 EMERGENCY REBUILD FIX - Cat Error Still Present

The "cat is not defined" error means there's still corrupted shell command code in the JavaScript build. Let's completely fix this:

## Step 1: Stop Everything and Check App.tsx
```bash
cd /home/ec2-user/PickNTrust
pm2 delete all

# Check what's actually in App.tsx
cat client/src/App.tsx | head -20

# If it still has shell commands or markdown, completely replace it
```

## Step 2: Force Replace App.tsx with Clean Code
```bash
cd /home/ec2-user/PickNTrust

# Completely overwrite App.tsx with clean React code
cat > client/src/App.tsx << 'REACT_EOF'
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
REACT_EOF

echo "✅ App.tsx completely replaced with clean React code"
```

## Step 3: Check for Other Corrupted Files
```bash
cd /home/ec2-user/PickNTrust

# Search for any files containing shell commands
grep -r "cat " client/src/ || echo "No cat commands found"
grep -r "bash" client/src/ || echo "No bash commands found"
grep -r "#!/bin" client/src/ || echo "No shell scripts found"

# If any files are found, they need to be fixed too
```

## Step 4: Complete Clean Rebuild
```bash
cd /home/ec2-user/PickNTrust

# Clean everything completely
rm -rf dist/
rm -rf client/dist/
rm -rf node_modules/.cache/
rm -rf client/node_modules/.cache/

# Clear npm cache
npm cache clean --force

# Rebuild everything
npm run build

# Check if build succeeded and what files were created
ls -la dist/public/assets/
```

## Step 5: Start Server with API Endpoints
```bash
cd /home/ec2-user/PickNTrust

# Start the complete server with API endpoints
NODE_ENV=production PORT=5000 pm2 start server-complete.mjs --name "pickntrust-final"

# Check status
pm2 status
pm2 logs pickntrust-final --lines 10
```

## Step 6: Test the Fixed Site
```bash
# Test API endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/announcements

# Test main page
curl -I http://localhost:5000/

# Check what JavaScript files were built
ls -la dist/public/assets/
```

## Step 7: Access and Verify
Open http://51.20.43.157 in browser and check:
- ✅ No "cat is not defined" error
- ✅ No "e.map is not a function" error
- ✅ Site loads properly
- ✅ Console is clean

## If Still Having Issues - Alternative Method
```bash
cd /home/ec2-user/PickNTrust

# Use dev server method (most reliable)
pm2 delete all

# Start API server
pm2 start server-complete.mjs --name "pickntrust-api" --env PORT=5000

# Start frontend dev server (this bypasses build issues)
pm2 start npx --name "pickntrust-dev" --cwd /home/ec2-user/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Update Nginx to use dev server
sudo sed -i 's/localhost:5000/localhost:5173/' /etc/nginx/sites-available/pickntrust
sudo systemctl restart nginx

# Access via http://51.20.43.157 (will use dev server)
```

The "cat is not defined" error indicates shell command code is still in the JavaScript build. This fix ensures complete cleanup and rebuild.
