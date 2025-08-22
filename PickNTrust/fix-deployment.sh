#!/bin/bash

echo "🚀 PickNTrust Deployment Fix Script"
echo "=================================="

# Step 1: Clean and install dependencies
echo "📦 Step 1: Cleaning and installing dependencies..."
rm -rf node_modules package-lock.json
npm install
npm install nanoid better-sqlite3

# Step 2: Initialize database with categories
echo "🗄️ Step 2: Setting up database..."
npm run db:push

# Add sample categories to database
echo "📝 Adding categories to database..."
sqlite3 sqlite.db << 'EOF'
INSERT OR IGNORE INTO categories (name, icon, color, description) VALUES
('Electronics & Gadgets', 'fas fa-laptop', '#3B82F6', 'Latest technology and smart devices'),
('Home & Living', 'fas fa-home', '#10B981', 'Transform your space with smart home solutions'),
('Beauty & Personal Care', 'fas fa-sparkles', '#EC4899', 'Premium beauty products for self-care'),
('Fashion & Clothing', 'fas fa-tshirt', '#8B5CF6', 'Trendy clothing and accessories'),
('Sports & Fitness', 'fas fa-dumbbell', '#F59E0B', 'Fitness equipment and sportswear'),
('Books & Education', 'fas fa-book', '#6366F1', 'Educational resources and books'),
('Toys & Games', 'fas fa-gamepad', '#EF4444', 'Fun toys and games for all ages'),
('Health & Wellness', 'fas fa-heart', '#14B8A6', 'Health supplements and wellness products'),
('Automotive', 'fas fa-car', '#6B7280', 'Car accessories and automotive products'),
('Kitchen & Dining', 'fas fa-utensils', '#F97316', 'Kitchen appliances and dining essentials'),
('Footwear & Accessories', 'fas fa-shoe-prints', '#8B5A2B', 'Shoes and fashion accessories'),
('Jewelry & Watches', 'fas fa-gem', '#FFD700', 'Elegant jewelry and timepieces'),
('Beauty & Grooming', 'fas fa-cut', '#FF69B4', 'Beauty and grooming essentials'),
('Baby & Kids', 'fas fa-baby', '#FF6B6B', 'Products for babies and children'),
('Pet Supplies', 'fas fa-paw', '#4ECDC4', 'Everything for your furry friends'),
('Garden & Outdoor', 'fas fa-seedling', '#2ECC71', 'Gardening and outdoor equipment'),
('Office Supplies', 'fas fa-briefcase', '#34495E', 'Office and business essentials'),
('Travel & Luggage', 'fas fa-suitcase', '#E67E22', 'Travel gear and luggage'),
('Music & Instruments', 'fas fa-music', '#9B59B6', 'Musical instruments and audio'),
('Art & Crafts', 'fas fa-palette', '#F39C12', 'Art supplies and craft materials'),
('Photography', 'fas fa-camera', '#1ABC9C', 'Cameras and photography equipment'),
('Gaming', 'fas fa-gamepad', '#E74C3C', 'Gaming consoles and accessories'),
('Software & Apps', 'fas fa-code', '#3498DB', 'Software and digital applications'),
('Subscription Services', 'fas fa-calendar-check', '#9B59B6', 'Monthly and yearly subscriptions'),
('Gift Cards', 'fas fa-gift', '#E91E63', 'Digital and physical gift cards'),
('Food & Beverages', 'fas fa-utensils', '#FF5722', 'Food items and beverages'),
('Cleaning Supplies', 'fas fa-broom', '#607D8B', 'Household cleaning products'),
('Tools & Hardware', 'fas fa-tools', '#795548', 'Tools and hardware supplies'),
('Stationery', 'fas fa-pen', '#673AB7', 'Pens, papers and office stationery'),
('Seasonal Items', 'fas fa-snowflake', '#00BCD4', 'Holiday and seasonal products'),
('Collectibles', 'fas fa-trophy', '#FFC107', 'Rare and collectible items'),
('Digital Products', 'fas fa-download', '#4CAF50', 'Digital downloads and courses'),
('Furniture', 'fas fa-couch', '#8BC34A', 'Home and office furniture'),
('Appliances', 'fas fa-blender', '#FF9800', 'Home and kitchen appliances'),
('Special Deals', 'fas fa-fire', '#F44336', 'Limited time offers and discounts'),
('AI Apps & Services', 'fas fa-robot', '#6C63FF', 'AI-powered applications and services');
EOF

# Step 3: Build application
echo "🔨 Step 3: Building application..."
npm run build

# Step 4: Verify database
echo "✅ Step 4: Verifying database setup..."
CATEGORY_COUNT=$(sqlite3 sqlite.db "SELECT COUNT(*) FROM categories;")
echo "Categories in database: $CATEGORY_COUNT"

if [ "$CATEGORY_COUNT" -gt "30" ]; then
    echo "✅ Database setup successful! $CATEGORY_COUNT categories added."
else
    echo "⚠️ Warning: Only $CATEGORY_COUNT categories found. Expected 36+."
fi

# Step 5: Check build output
echo "📁 Step 5: Checking build output..."
if [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed. Running manual build..."
    npx vite build
fi

if [ -f "dist/server/index.js" ]; then
    echo "✅ Backend build successful!"
else
    echo "❌ Backend build failed."
fi

echo ""
echo "🎉 Deployment fix complete!"
echo ""
echo "To start the server, run:"
echo "npm start"
echo ""
echo "To verify everything works:"
echo "1. Visit your website"
echo "2. Check hamburger menu shows all categories"
echo "3. Go to /admin and verify categories dropdown"
echo ""
