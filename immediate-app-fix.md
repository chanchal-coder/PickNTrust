# 🚨 IMMEDIATE APP.TSX FIX

The App.tsx file still contains markdown instead of React code. Here's the immediate fix:

## Step 1: Completely Replace App.tsx
```bash
cd /home/ec2-user/PickNTrust

# Completely replace the corrupted App.tsx file
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

echo "✅ App.tsx completely replaced with clean React code"
```

## Step 2: Verify the Fix
```bash
cd /home/ec2-user/PickNTrust

# Check the first 10 lines to make sure it's React code
head -10 client/src/App.tsx

# Should show React imports, not markdown
```

## Step 3: Fix CORS and Rebuild
```bash
cd /home/ec2-user/PickNTrust

# Simple CORS fix
sed -i 's/origin: function (origin, callback) {[^}]*}/origin: true/g' server/index.ts

# Clean rebuild
rm -rf dist/
npm run build

# Check if build succeeded
ls -la dist/public/assets/
```

## Step 4: Start Backend
```bash
cd /home/ec2-user/PickNTrust

# Stop all PM2 processes
pm2 delete all

# Start backend
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check status
pm2 status
pm2 logs pickntrust-backend --lines 5
```

## Step 5: Test
```bash
# Test API
curl http://localhost:5000/api/health

# Test main page
curl -I http://localhost:5000/
```

The App.tsx file was corrupted with markdown content. This fix completely replaces it with proper React code.
