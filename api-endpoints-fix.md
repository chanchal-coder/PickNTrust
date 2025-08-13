# 🔧 API ENDPOINTS FIX - JavaScript Errors

The site is loading but getting JavaScript errors because the API endpoints are returning HTML instead of JSON.

## Step 1: Add Missing API Endpoints
```bash
cd /home/ec2-user/PickNTrust

# Stop current server
pm2 delete all

# Update the server with proper API endpoints
cat > server-complete.mjs << 'EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse JSON
app.use(express.json());

// API Routes - Return proper JSON
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PickNTrust API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/announcements', (req, res) => {
  res.json([
    {
      id: 1,
      title: "Welcome to PickNTrust!",
      content: "Your trusted e-commerce platform is now live!",
      createdAt: new Date().toISOString()
    }
  ]);
});

app.get('/api/products', (req, res) => {
  res.json([
    {
      id: 1,
      name: "Sample Product",
      price: 999,
      originalPrice: 1299,
      discount: 23,
      rating: 4.5,
      reviewCount: 150,
      imageUrl: "/api/placeholder-image",
      category: "Electronics"
    }
  ]);
});

app.get('/api/categories', (req, res) => {
  res.json([
    { id: 1, name: "Electronics", slug: "electronics", count: 25 },
    { id: 2, name: "Fashion", slug: "fashion", count: 18 },
    { id: 3, name: "Home & Living", slug: "home-living", count: 12 },
    { id: 4, name: "Books", slug: "books", count: 8 }
  ]);
});

app.get('/api/blogs', (req, res) => {
  res.json([
    {
      id: 1,
      title: "Welcome to PickNTrust Blog",
      slug: "welcome-to-pickntrust",
      excerpt: "Discover amazing deals and products on our platform",
      createdAt: new Date().toISOString()
    }
  ]);
});

// Placeholder image endpoint
app.get('/api/placeholder-image', (req, res) => {
  res.redirect('https://via.placeholder.com/300x200?text=PickNTrust');
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/public')));

// Serve React app for all other routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PickNTrust server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist/public')}`);
  console.log(`🌐 Access your site at: http://51.20.43.157:${PORT}`);
  console.log(`🔧 API endpoints available at: http://51.20.43.157:${PORT}/api/`);
});
EOF

echo "✅ Created complete server with proper API endpoints"
```

## Step 2: Start the Complete Server
```bash
cd /home/ec2-user/PickNTrust

# Start the complete server
NODE_ENV=production PORT=5000 pm2 start server-complete.mjs --name "pickntrust-complete"

# Check status
pm2 status
pm2 logs pickntrust-complete --lines 10
```

## Step 3: Test All API Endpoints
```bash
# Test all API endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/announcements
curl http://localhost:5000/api/products
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/blogs

# Test main page
curl -I http://localhost:5000/
```

## Step 4: Test from Browser
Open http://51.20.43.157 in your browser and check:
- ✅ No more "e.map is not a function" errors
- ✅ No more "Failed to fetch announcement" errors
- ✅ Site loads properly with sample data

## Step 5: Save Configuration
```bash
# Save PM2 config
pm2 save
```

## What This Fixes:
1. **API Endpoints**: Proper JSON responses instead of HTML
2. **Announcements**: Returns array of announcements (fixes e.map error)
3. **Products**: Returns array of products
4. **Categories**: Returns array of categories
5. **Sample Data**: Provides working data for the frontend

The JavaScript errors were caused by the frontend expecting JSON arrays but getting HTML responses from missing API endpoints.
