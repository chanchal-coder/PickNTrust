# 🔧 Final Fix: Remove "cat" Command from App.tsx

## The Problem
Your `client/src/App.tsx` file has a shell command mixed into the code:
```
cat > client/src/App.tsx << 'EOF'
```

This is causing the JavaScript error: `cat is not defined`

## Step 1: Fix App.tsx File
```bash
cd /home/ec2-user/PickNTrust

# Backup the current file
cp client/src/App.tsx client/src/App.tsx.broken

# Remove the problematic line and fix the file
sed -i '/cat > client\/src\/App\.tsx << '\''EOF'\''/d' client/src/App.tsx

# Check if the file looks correct now
head -20 client/src/App.tsx
```

## Step 2: If App.tsx is Still Broken, Recreate It
```bash
cd /home/ec2-user/PickNTrust

# Create a clean App.tsx file
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

## Step 3: Rebuild the Project
```bash
cd /home/ec2-user/PickNTrust

# Clean build
rm -rf dist/

# Rebuild
npm run build

# Check if build succeeded
ls -la dist/public/assets/
```

## Step 4: Restart Backend
```bash
cd /home/ec2-user/PickNTrust

# Stop current backend
pm2 delete pickntrust-backend

# Start backend in production mode
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check status
pm2 status
pm2 logs pickntrust-backend --lines 5
```

## Step 5: Test the Fix
```bash
# Test static assets (should return 200 OK now)
curl -I http://localhost:5000/assets/style-Clbwe4xK.css
curl -I http://localhost:5000/assets/index-BnS10Zvs.js

# Test main page
curl -I http://localhost:5000/
```

## Step 6: Save PM2 Configuration
```bash
pm2 save
```

## Expected Results:
- ✅ No more "cat is not defined" JavaScript errors
- ✅ Static assets load properly (200 OK responses)
- ✅ React app loads without white page
- ✅ Site accessible at http://51.20.43.157

The issue was that a shell command got mixed into your React code, causing the JavaScript runtime to try to execute `cat` as a JavaScript function, which doesn't exist.
