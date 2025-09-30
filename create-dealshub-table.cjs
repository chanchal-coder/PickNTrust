// Create DealsHub Products Database Table
// Multi-URL support with same features as other picks tables

const Database = require('better-sqlite3');

console.log('🛒 CREATING DEALSHUB DATABASE TABLE');
console.log('=' .repeat(60));
console.log('Target Purpose: Create dealshub_products table for multi-URL support');
console.log('Stats Features: Same structure as Global Picks + deals-focused features');
console.log('Link URL Support: All types (Amazon, Flipkart, Shopsy, EarnKaro, Cuelinks, etc.)');
console.log('=' .repeat(60));

async function createDealsHubTable() {
  try {
    console.log('\n1. 🗄️ Connecting to Database...');
    
    const db = new Database('database.sqlite');
    
    console.log('\n2. 🏗️ Creating DealsHub Products Table...');
    
    // Create dealshub_products table with comprehensive structure
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS dealshub_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT,
        original_price TEXT,
        currency TEXT DEFAULT 'INR',
        image_url TEXT,
        affiliate_url TEXT,
        original_url TEXT,
        category TEXT,
        rating REAL,
        review_count INTEGER,
        discount INTEGER,
        is_new INTEGER DEFAULT 1,
        is_featured INTEGER DEFAULT 0,
        affiliate_network TEXT DEFAULT 'Universal',
        telegram_message_id INTEGER,
        telegram_channel_id INTEGER,
        telegram_channel_name TEXT DEFAULT 'DealsHub',
        processing_status TEXT DEFAULT 'active',
        content_type TEXT DEFAULT 'product',
        affiliate_tag_applied INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        
        -- Multi-URL support fields
        url_type TEXT, -- 'amazon', 'flipkart', 'shopsy', 'earnkaro', 'cuelinks', 'direct', etc.
        source_platform TEXT, -- Original platform detected
        redirect_chain TEXT, -- JSON array of redirect URLs
        final_destination TEXT, -- Final resolved URL
        
        -- Enhanced affiliate support
        primary_affiliate TEXT, -- Primary affiliate network used
        secondary_affiliate TEXT, -- Backup affiliate network
        affiliate_commission REAL, -- Expected commission rate
        
        -- Advanced product data
        brand TEXT,
        model TEXT,
        sku TEXT,
        availability TEXT DEFAULT 'in_stock',
        shipping_info TEXT,
        return_policy TEXT,
        
        -- DealsHub specific fields
        deal_type TEXT DEFAULT 'regular', -- 'flash', 'daily', 'weekly', 'clearance', 'regular'
        deal_priority INTEGER DEFAULT 0, -- Higher number = higher priority
        deal_expires_at INTEGER, -- Deal expiration timestamp
        deal_start_time INTEGER, -- Deal start timestamp
        deal_end_time INTEGER, -- Deal end timestamp
        deal_status TEXT DEFAULT 'active', -- 'active', 'expired', 'upcoming', 'paused'
        deal_badge TEXT, -- 'Hot Deal', 'Limited Time', 'Flash Sale', etc.
        deal_urgency_level INTEGER DEFAULT 1, -- 1-5 scale for urgency
        
        -- Inventory and stock
        stock_quantity INTEGER,
        stock_status TEXT DEFAULT 'in_stock', -- 'in_stock', 'low_stock', 'out_of_stock'
        min_order_quantity INTEGER DEFAULT 1,
        max_order_quantity INTEGER,
        
        -- Pricing history
        price_history TEXT, -- JSON array of price changes
        lowest_price REAL, -- Historical lowest price
        highest_price REAL, -- Historical highest price
        price_drop_percentage REAL, -- Recent price drop %
        
        -- SEO and metadata
        meta_title TEXT,
        meta_description TEXT,
        keywords TEXT,
        
        -- Analytics and tracking
        view_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        conversion_count INTEGER DEFAULT 0,
        last_viewed INTEGER,
        
        -- Quality and validation
        data_quality_score REAL DEFAULT 0.0,
        image_quality_score REAL DEFAULT 0.0,
        content_completeness REAL DEFAULT 0.0,
        validation_status TEXT DEFAULT 'pending',
        
        -- Display and sorting
        display_order INTEGER DEFAULT 0,
        featured_order INTEGER DEFAULT 0,
        category_order INTEGER DEFAULT 0,
        deal_order INTEGER DEFAULT 0, -- Special ordering for deals
        
        -- Admin and moderation
        admin_notes TEXT,
        moderation_status TEXT DEFAULT 'approved',
        moderator_id TEXT,
        moderated_at INTEGER,
        
        -- Performance metrics
        engagement_score REAL DEFAULT 0.0, -- User engagement metric
        conversion_rate REAL DEFAULT 0.0, -- Click to conversion rate
        revenue_generated REAL DEFAULT 0.0, -- Estimated revenue
        
        -- Social proof
        social_shares INTEGER DEFAULT 0,
        social_likes INTEGER DEFAULT 0,
        user_saves INTEGER DEFAULT 0, -- How many users saved this deal
        
        -- Notification settings
        notify_price_drop INTEGER DEFAULT 0, -- Send notifications on price drops
        notify_back_in_stock INTEGER DEFAULT 0, -- Send notifications when back in stock
        notification_threshold REAL, -- Price threshold for notifications
        
        -- Seasonal and trending
        is_trending INTEGER DEFAULT 0,
        is_seasonal INTEGER DEFAULT 0,
        seasonal_category TEXT, -- 'summer', 'winter', 'festival', etc.
        trending_score REAL DEFAULT 0.0
      )
    `;
    
    db.exec(createTableSQL);
    console.log('Success DealsHub products table created successfully');
    
    console.log('\n3. Stats Creating Indexes for Performance...');
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_dealshub_status ON dealshub_products(processing_status)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_category ON dealshub_products(category)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_created ON dealshub_products(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_featured ON dealshub_products(is_featured)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_url_type ON dealshub_products(url_type)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_platform ON dealshub_products(source_platform)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_affiliate ON dealshub_products(primary_affiliate)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_quality ON dealshub_products(data_quality_score)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_display ON dealshub_products(display_order)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_telegram ON dealshub_products(telegram_message_id)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_deal_type ON dealshub_products(deal_type)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_deal_status ON dealshub_products(deal_status)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_deal_expires ON dealshub_products(deal_expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_deal_priority ON dealshub_products(deal_priority)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_discount ON dealshub_products(discount)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_trending ON dealshub_products(is_trending)',
      'CREATE INDEX IF NOT EXISTS idx_dealshub_engagement ON dealshub_products(engagement_score)'
    ];
    
    indexes.forEach((indexSQL, i) => {
      db.exec(indexSQL);
      console.log(`   Success Index ${i + 1}/${indexes.length} created`);
    });
    
    console.log('\n4. Target Adding Sample DealsHub Products...');
    
    // Sample products with deals focus
    const sampleProducts = [
      {
        name: 'Flash Sale: Wireless Earbuds Pro',
        description: 'Premium wireless earbuds with active noise cancellation - Limited time offer!',
        price: '1999',
        original_price: '4999',
        image_url: null,
        affiliate_url: 'https://example.com/affiliate/earbuds-flash',
        original_url: 'https://amazon.in/dp/B08FLASH123',
        category: 'Electronics',
        rating: 4.6,
        review_count: 2500,
        discount: 60,
        url_type: 'amazon',
        source_platform: 'Amazon',
        primary_affiliate: 'Amazon Associates',
        brand: 'AudioTech',
        availability: 'in_stock',
        data_quality_score: 0.95,
        deal_type: 'flash',
        deal_priority: 5,
        deal_badge: 'Flash Sale',
        deal_urgency_level: 5,
        stock_quantity: 50,
        stock_status: 'low_stock',
        price_drop_percentage: 60.0,
        is_trending: 1,
        engagement_score: 0.92
      },
      {
        name: 'Daily Deal: Smart Fitness Tracker',
        description: 'Advanced fitness tracker with heart rate monitoring and GPS - Today only!',
        price: '2499',
        original_price: '3999',
        image_url: null,
        affiliate_url: 'https://example.com/affiliate/fitness-daily',
        original_url: 'https://flipkart.com/product/fitness-daily',
        category: 'Health & Fitness',
        rating: 4.4,
        review_count: 1800,
        discount: 38,
        url_type: 'flipkart',
        source_platform: 'Flipkart',
        primary_affiliate: 'Flipkart Affiliate',
        brand: 'FitPro',
        availability: 'in_stock',
        data_quality_score: 0.88,
        deal_type: 'daily',
        deal_priority: 4,
        deal_badge: 'Daily Deal',
        deal_urgency_level: 4,
        stock_quantity: 200,
        stock_status: 'in_stock',
        price_drop_percentage: 37.5,
        is_featured: 1,
        engagement_score: 0.85
      },
      {
        name: 'Clearance: Premium Coffee Maker',
        description: 'Automatic coffee maker with multiple brewing options - Clearance sale!',
        price: '4999',
        original_price: '8999',
        image_url: null,
        affiliate_url: 'https://example.com/affiliate/coffee-clearance',
        original_url: 'https://shopsy.in/product/coffee-clearance',
        category: 'Home & Kitchen',
        rating: 4.7,
        review_count: 650,
        discount: 44,
        url_type: 'shopsy',
        source_platform: 'Shopsy',
        primary_affiliate: 'Shopsy Affiliate',
        brand: 'BrewMaster',
        availability: 'in_stock',
        data_quality_score: 0.90,
        deal_type: 'clearance',
        deal_priority: 3,
        deal_badge: 'Clearance',
        deal_urgency_level: 3,
        stock_quantity: 25,
        stock_status: 'low_stock',
        price_drop_percentage: 44.4,
        engagement_score: 0.78
      },
      {
        name: 'Hot Deal: Gaming Mechanical Keyboard',
        description: 'RGB mechanical keyboard for gaming enthusiasts - Limited stock!',
        price: '2999',
        original_price: '4499',
        image_url: null,
        affiliate_url: 'https://example.com/affiliate/keyboard-hot',
        original_url: 'https://example-store.com/gaming-keyboard-hot',
        category: 'Gaming',
        rating: 4.8,
        review_count: 950,
        discount: 33,
        url_type: 'direct',
        source_platform: 'Direct Store',
        primary_affiliate: 'Universal',
        brand: 'GameTech',
        availability: 'in_stock',
        data_quality_score: 0.87,
        deal_type: 'weekly',
        deal_priority: 4,
        deal_badge: 'Hot Deal',
        deal_urgency_level: 4,
        stock_quantity: 100,
        stock_status: 'in_stock',
        price_drop_percentage: 33.3,
        is_trending: 1,
        engagement_score: 0.89
      },
      {
        name: 'Limited Time: Wireless Power Bank 20000mAh',
        description: 'Fast charging wireless power bank with digital display - Hurry up!',
        price: '1799',
        original_price: '2999',
        image_url: null,
        affiliate_url: 'https://example.com/affiliate/powerbank-limited',
        original_url: 'https://multi-platform-deals.com',
        category: 'Mobile Accessories',
        rating: 4.5,
        review_count: 1500,
        discount: 40,
        url_type: 'universal',
        source_platform: 'Multi-Platform',
        primary_affiliate: 'Universal',
        brand: 'PowerMax',
        availability: 'in_stock',
        data_quality_score: 0.91,
        deal_type: 'flash',
        deal_priority: 5,
        deal_badge: 'Limited Time',
        deal_urgency_level: 5,
        stock_quantity: 75,
        stock_status: 'in_stock',
        price_drop_percentage: 40.0,
        is_featured: 1,
        is_trending: 1,
        engagement_score: 0.93
      },
      {
        name: 'Mega Deal: Smart Home Security Camera 4K',
        description: '4K WiFi security camera with night vision and AI detection - Best price!',
        price: '3499',
        original_price: '5999',
        image_url: null,
        affiliate_url: 'https://example.com/affiliate/camera-mega',
        original_url: 'https://security-deals.com/camera',
        category: 'Smart Home',
        rating: 4.6,
        review_count: 780,
        discount: 42,
        url_type: 'direct',
        source_platform: 'Specialty Store',
        primary_affiliate: 'Direct',
        brand: 'SecureTech',
        availability: 'in_stock',
        data_quality_score: 0.89,
        deal_type: 'weekly',
        deal_priority: 4,
        deal_badge: 'Mega Deal',
        deal_urgency_level: 3,
        stock_quantity: 150,
        stock_status: 'in_stock',
        price_drop_percentage: 41.7,
        engagement_score: 0.86
      }
    ];
    
    const insertStmt = db.prepare(`
      INSERT INTO dealshub_products (
        name, description, price, original_price, image_url, affiliate_url, original_url,
        category, rating, review_count, discount, url_type, source_platform, primary_affiliate,
        brand, availability, data_quality_score, telegram_channel_name, deal_type, deal_priority,
        deal_badge, deal_urgency_level, stock_quantity, stock_status, price_drop_percentage,
        is_featured, is_trending, engagement_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    sampleProducts.forEach((product, index) => {
      insertStmt.run(
        product.name,
        product.description,
        product.price,
        product.original_price,
        product.image_url,
        product.affiliate_url,
        product.original_url,
        product.category,
        product.rating,
        product.review_count,
        product.discount,
        product.url_type,
        product.source_platform,
        product.primary_affiliate,
        product.brand,
        product.availability,
        product.data_quality_score,
        'DealsHub',
        product.deal_type,
        product.deal_priority,
        product.deal_badge,
        product.deal_urgency_level,
        product.stock_quantity,
        product.stock_status,
        product.price_drop_percentage,
        product.is_featured || 0,
        product.is_trending || 0,
        product.engagement_score
      );
      console.log(`   Success Sample product ${index + 1}/6 added: ${product.name}`);
    });
    
    console.log('\n5. Stats Verifying Table Structure...');
    
    // Verify table structure
    const tableInfo = db.prepare('PRAGMA table_info(dealshub_products)').all();
    console.log(`Success Table created with ${tableInfo.length} columns`);
    
    // Count products
    const productCount = db.prepare('SELECT COUNT(*) as count FROM dealshub_products').get();
    console.log(`Success ${productCount.count} sample products added`);
    
    // Show sample data with deals focus
    const sampleData = db.prepare(`
      SELECT name, category, price, discount, deal_type, deal_badge, deal_priority, 
             url_type, source_platform, primary_affiliate, engagement_score
      FROM dealshub_products 
      ORDER BY deal_priority DESC, engagement_score DESC
      LIMIT 3
    `).all();
    
    console.log('\n📋 Top Sample Deals:');
    sampleData.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      Category: ${product.category}`);
      console.log(`      Price: ₹${product.price} (${product.discount}% off)`);
      console.log(`      Deal: ${product.deal_badge} (Priority: ${product.deal_priority})`);
      console.log(`      Type: ${product.url_type} | Platform: ${product.source_platform}`);
      console.log(`      Affiliate: ${product.primary_affiliate}`);
      console.log(`      Engagement: ${product.engagement_score}`);
    });
    
    console.log('\n6. Success DEALSHUB DATABASE SETUP COMPLETE!');
    
    console.log('\n🛒 DEALSHUB FEATURES:');
    console.log('   Success Multi-URL Support (All platforms)');
    console.log('   Success Advanced Deal Management');
    console.log('   Success Deal Types (Flash, Daily, Weekly, Clearance)');
    console.log('   Success Priority & Urgency System');
    console.log('   Success Stock & Inventory Tracking');
    console.log('   Success Price History & Drop Tracking');
    console.log('   Success Engagement & Performance Metrics');
    console.log('   Success Social Proof & Trending System');
    console.log('   Success Notification & Alert System');
    console.log('   Success Seasonal & Category Management');
    
    console.log('\nLink URL TYPE SUPPORT:');
    console.log('   Success Amazon (amazon.in, amazon.com)');
    console.log('   Success Flipkart (flipkart.com)');
    console.log('   Success Shopsy (shopsy.in)');
    console.log('   Success EarnKaro (ekaro.in)');
    console.log('   Success Cuelinks (cuelinks.com)');
    console.log('   Success Direct Store URLs');
    console.log('   Success Universal/Multi-platform');
    
    console.log('\n🏷️ DEAL TYPES:');
    console.log('   Success Flash Sales (High urgency, limited time)');
    console.log('   Success Daily Deals (24-hour specials)');
    console.log('   Success Weekly Deals (7-day promotions)');
    console.log('   Success Clearance Sales (Stock clearance)');
    console.log('   Success Regular Deals (Standard promotions)');
    console.log('   Success Seasonal Deals (Festival/holiday specials)');
    
    console.log('\nPrice AFFILIATE NETWORKS:');
    console.log('   Success Amazon Associates');
    console.log('   Success Flipkart Affiliate');
    console.log('   Success EarnKaro');
    console.log('   Success Cuelinks');
    console.log('   Success Direct Affiliate Programs');
    console.log('   Success Universal Tracking');
    
    console.log('\nTarget NEXT STEPS:');
    console.log('   1. AI Create DealsHub Telegram Bot');
    console.log('   2. Global Add Backend API Endpoints');
    console.log('   3. 🎨 Create Frontend Page');
    console.log('   4. ⚙️ Configure Environment Settings');
    console.log('   5. 🧪 Test Multi-URL Processing');
    
    db.close();
    
    console.log('\nCelebration DEALSHUB DATABASE READY!');
    console.log('Special Multi-URL support with advanced deal features!');
    
  } catch (error) {
    console.error('Error Error creating DealsHub table:', error.message);
  }
}

// Run the database setup
createDealsHubTable().catch(console.error);