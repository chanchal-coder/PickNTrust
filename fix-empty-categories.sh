#!/bin/bash

# Fix Empty Categories - Populate Database with Sample Data
# This script adds sample categories to resolve "No Categories Available"

echo "🔧 Fixing Empty Categories Database"
echo "==================================="

# Navigate to project directory
cd /home/ec2-user/PickNTrust

# Check if database exists
echo "📊 Checking database status..."
if [ -f "database.sqlite" ]; then
    echo "✅ Database file exists: database.sqlite"
else
    echo "❌ Database file not found: database.sqlite"
    echo "Creating database..."
    touch database.sqlite
fi

# Check current categories
echo ""
echo "📋 Current categories in database:"
sqlite3 database.sqlite "SELECT COUNT(*) as category_count FROM categories;" 2>/dev/null || echo "Categories table may not exist"

# Create categories table if it doesn't exist
echo ""
echo "🏗️ Ensuring categories table exists..."
sqlite3 database.sqlite << 'EOF'
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'fas fa-tag',
    displayOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
EOF

echo "✅ Categories table created/verified"

# Insert sample categories
echo ""
echo "📝 Adding sample categories..."
sqlite3 database.sqlite << 'EOF'
INSERT OR IGNORE INTO categories (name, description, color, icon, displayOrder) VALUES
('Electronics', 'Latest gadgets and electronic devices', '#3B82F6', 'fas fa-laptop', 1),
('Fashion', 'Trendy clothing and accessories', '#EC4899', 'fas fa-tshirt', 2),
('Home & Garden', 'Home improvement and gardening essentials', '#10B981', 'fas fa-home', 3),
('Sports & Fitness', 'Sports equipment and fitness gear', '#F59E0B', 'fas fa-dumbbell', 4),
('Books & Media', 'Books, movies, and entertainment', '#8B5CF6', 'fas fa-book', 5),
('Health & Beauty', 'Health and beauty products', '#EF4444', 'fas fa-heart', 6),
('Automotive', 'Car accessories and automotive parts', '#6B7280', 'fas fa-car', 7),
('Travel', 'Travel gear and accessories', '#06B6D4', 'fas fa-plane', 8);
EOF

echo "✅ Sample categories added"

# Verify categories were added
echo ""
echo "📊 Verifying categories..."
CATEGORY_COUNT=$(sqlite3 database.sqlite "SELECT COUNT(*) FROM categories;")
echo "Total categories in database: $CATEGORY_COUNT"

if [ "$CATEGORY_COUNT" -gt 0 ]; then
    echo "✅ Categories successfully added!"
    echo ""
    echo "📋 Categories list:"
    sqlite3 database.sqlite "SELECT id, name, description FROM categories ORDER BY displayOrder;"
else
    echo "❌ No categories found - there may be an issue"
fi

# Check if products table exists and add sample products
echo ""
echo "🏗️ Checking products table..."
sqlite3 database.sqlite << 'EOF'
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    originalPrice REAL,
    currency TEXT DEFAULT 'INR',
    category TEXT NOT NULL,
    categoryId INTEGER,
    gender TEXT DEFAULT 'unisex',
    rating TEXT DEFAULT '4.0',
    reviewCount INTEGER DEFAULT 0,
    imageUrl TEXT,
    affiliateUrl TEXT,
    isActive BOOLEAN DEFAULT 1,
    isFeatured BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
);
EOF

# Add sample products
echo "📝 Adding sample products..."
sqlite3 database.sqlite << 'EOF'
INSERT OR IGNORE INTO products (name, description, price, originalPrice, currency, category, categoryId, imageUrl, affiliateUrl) VALUES
('Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 2999, 4999, 'INR', 'Electronics', 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', '#'),
('Smart Fitness Watch', 'Track your fitness goals with this advanced smartwatch', 8999, 12999, 'INR', 'Electronics', 1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', '#'),
('Cotton T-Shirt', 'Comfortable cotton t-shirt in various colors', 599, 999, 'INR', 'Fashion', 2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80', '#'),
('Running Shoes', 'Lightweight running shoes for daily workouts', 3499, 5999, 'INR', 'Sports & Fitness', 4, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', '#'),
('Indoor Plant Set', 'Beautiful indoor plants to brighten your home', 1299, 1999, 'INR', 'Home & Garden', 3, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', '#');
EOF

echo "✅ Sample products added"

# Restart backend to refresh database connections
echo ""
echo "🔄 Restarting backend server..."
pm2 restart pickntrust-backend

# Wait for server to restart
echo "⏳ Waiting for server to restart..."
sleep 5

# Test API endpoints
echo ""
echo "🧪 Testing categories API..."
if curl -s http://127.0.0.1:5000/api/categories | grep -q "Electronics\|Fashion"; then
    echo "✅ Categories API is working!"
else
    echo "⚠️ Categories API may not be working properly"
    echo "Testing API response:"
    curl -s http://127.0.0.1:5000/api/categories | head -200
fi

# Test products API
echo ""
echo "🧪 Testing products API..."
if curl -s http://127.0.0.1:5000/api/products | grep -q "Headphones\|Watch"; then
    echo "✅ Products API is working!"
else
    echo "⚠️ Products API may not be working properly"
fi

# Final database summary
echo ""
echo "📊 Final Database Summary:"
echo "========================="
echo "Categories: $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM categories;')"
echo "Products: $(sqlite3 database.sqlite 'SELECT COUNT(*) FROM products;')"

echo ""
echo "🎉 Categories fix completed!"
echo ""
echo "📝 What was fixed:"
echo "   ✅ Created/verified categories table"
echo "   ✅ Added 8 sample categories"
echo "   ✅ Added 5 sample products"
echo "   ✅ Restarted backend server"
echo "   ✅ Tested API endpoints"
echo ""
echo "📝 Your website should now show categories!"
echo "   🌐 Visit: http://YOUR_SERVER_IP"
echo "   📱 Categories should be visible on homepage"
echo ""
echo "📝 If categories still don't show:"
echo "   1. Check API: curl http://127.0.0.1:5000/api/categories"
echo "   2. Check logs: pm2 logs pickntrust-backend"
echo "   3. Check database: sqlite3 database.sqlite 'SELECT * FROM categories;'"