# 🔧 Fix Missing Search Page

## The Problem
Build is failing because `client/src/pages/search` doesn't exist but is imported in App.tsx.

## Step 1: Create Missing Search Page
```bash
cd /home/ec2-user/PickNTrust

# Create the missing search page
cat > client/src/pages/search.tsx << 'EOF'
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Search() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const searchQuery = urlParams.get('q') || '';

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/products/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return { products: [] };
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search Results
          </h1>
          {searchQuery && (
            <p className="text-gray-600 dark:text-gray-400">
              Showing results for "{searchQuery}"
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Searching...</p>
          </div>
        ) : searchResults?.products?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.products.map((product: any) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => window.open(product.affiliateLink, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      View Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No results found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try different keywords or browse our categories
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Browse Categories
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Start your search
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a search term to find products
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
EOF
```

## Step 2: Rebuild the Project
```bash
cd /home/ec2-user/PickNTrust

# Clean build
rm -rf dist/

# Rebuild
npm run build

# Check if build succeeded
ls -la dist/public/assets/
```

## Step 3: Restart Backend
```bash
cd /home/ec2-user/PickNTrust

# Stop current backend
pm2 delete pickntrust-backend

# Start backend in production mode
NODE_ENV=production PORT=5000 pm2 start dist/server/index.js --name "pickntrust-backend"

# Check status
pm2 status
```

## Step 4: Test the Application
```bash
# Test main page
curl -I http://localhost:5000/

# Test static assets
curl -I http://localhost:5000/assets/style-Clbwe4xK.css
```

## Step 5: Save Configuration
```bash
pm2 save
```

## Expected Results:
- ✅ Build completes successfully
- ✅ No more missing file errors
- ✅ React app loads without JavaScript errors
- ✅ Site accessible at http://51.20.43.157

The search page is now created and the build should complete successfully!
