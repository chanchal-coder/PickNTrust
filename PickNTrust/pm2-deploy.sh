#!/bin/bash

echo "🚀 PickNTrust PM2 Deployment Script"
echo "===================================="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo ""

# Step 1: Clean and install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
npm install nanoid better-sqlite3

# Step 2: Build backend
echo "🔨 Step 2: Building backend..."
npm run build

# Step 3: Initialize database
echo "🗄️ Step 3: Setting up database..."
npm run db:push

# Add categories to database
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

# Step 4: Create logs directory
echo "📁 Step 4: Creating logs directory..."
mkdir -p logs

# Step 5: Stop any existing PM2 processes
echo "🛑 Step 5: Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true

# Step 6: Start PM2 applications
echo "🚀 Step 6: Starting PM2 applications..."
pm2 start ecosystem.config.cjs

# Step 7: Save PM2 configuration
echo "💾 Step 7: Saving PM2 configuration..."
pm2 save

# Step 8: Setup PM2 startup (optional)
echo "⚙️ Step 8: Setting up PM2 startup..."
pm2 startup

# Step 9: Verify deployment
echo "✅ Step 9: Verifying deployment..."
sleep 5

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Checking services..."

# Check backend
if curl -s http://localhost:5000/api/categories > /dev/null; then
    echo "✅ Backend (port 5000): Running"
else
    echo "❌ Backend (port 5000): Not responding"
fi

# Check frontend (may take longer to start)
sleep 10
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend (port 5173): Running"
else
    echo "⏳ Frontend (port 5173): Still starting up..."
fi

# Check database
CATEGORY_COUNT=$(sqlite3 sqlite.db "SELECT COUNT(*) FROM categories;" 2>/dev/null || echo "0")
echo "📊 Categories in database: $CATEGORY_COUNT"

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   Admin:    http://localhost:5173/admin"
echo ""
echo "📋 PM2 Management Commands:"
echo "   pm2 status                    # Check status"
echo "   pm2 logs                      # View all logs"
echo "   pm2 logs pickntrust-frontend  # Frontend logs"
echo "   pm2 logs pickntrust-backend   # Backend logs"
echo "   pm2 restart all               # Restart both"
echo "   pm2 stop all                  # Stop both"
echo "   pm2 monit                     # Real-time monitoring"
echo ""
