const Database = require('better-sqlite3');

console.log('Hot Creating Today\'s Top Picks products table...');

try {
  const db = new Database('database.sqlite');
  
  // Create top_picks_products table with comprehensive schema
  console.log('📋 Creating top_picks_products table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS top_picks_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT,
      original_price TEXT,
      currency TEXT DEFAULT 'INR',
      image_url TEXT,
      affiliate_url TEXT NOT NULL,
      original_url TEXT,
      category TEXT,
      subcategory TEXT,
      rating TEXT,
      review_count TEXT,
      discount TEXT,
      is_featured BOOLEAN DEFAULT 0,
      is_new BOOLEAN DEFAULT 1,
      has_timer BOOLEAN DEFAULT 0,
      timer_duration INTEGER,
      timer_start_time INTEGER,
      has_limited_offer BOOLEAN DEFAULT 0,
      limited_offer_text TEXT,
      
      -- Affiliate system fields
      affiliate_network TEXT DEFAULT 'top-picks',
      affiliate_network_id INTEGER,
      affiliate_tag_applied BOOLEAN DEFAULT 1,
      commission_rate REAL,
      
      -- Telegram integration fields
      telegram_message_id INTEGER,
      telegram_channel_id TEXT,
      processing_status TEXT DEFAULT 'active',
      
      -- Bundle support fields
      message_group_id TEXT,
      product_sequence INTEGER DEFAULT 1,
      total_in_group INTEGER DEFAULT 1,
      
      -- Today's Top Picks specific fields
      is_viral BOOLEAN DEFAULT 0,
      is_trending BOOLEAN DEFAULT 0,
      is_limited_deal BOOLEAN DEFAULT 0,
      is_new_offer BOOLEAN DEFAULT 0,
      trend_score REAL DEFAULT 0.0, -- Calculated trending score
      viral_score REAL DEFAULT 0.0, -- Calculated viral score
      popularity_rank INTEGER DEFAULT 0,
      
      -- Trend detection fields
      view_velocity REAL DEFAULT 0.0, -- Views per hour
      click_velocity REAL DEFAULT 0.0, -- Clicks per hour
      share_count INTEGER DEFAULT 0,
      wishlist_count INTEGER DEFAULT 0,
      conversion_velocity REAL DEFAULT 0.0, -- Conversions per hour
      
      -- Time-based trending
      trending_start_time INTEGER,
      trending_duration INTEGER, -- How long it's been trending
      peak_performance_time INTEGER,
      
      -- Deal urgency fields
      deal_urgency_level TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
      stock_level TEXT, -- 'high', 'medium', 'low', 'limited'
      deal_expires_at INTEGER,
      flash_sale BOOLEAN DEFAULT 0,
      
      -- Social proof fields
      recent_purchases INTEGER DEFAULT 0, -- Purchases in last 24h
      social_mentions INTEGER DEFAULT 0,
      influencer_endorsed BOOLEAN DEFAULT 0,
      
      -- Quality indicators
      quality_score REAL DEFAULT 0.0,
      user_satisfaction REAL DEFAULT 0.0,
      return_rate REAL DEFAULT 0.0,
      
      -- Source tracking
      source_domain TEXT,
      source_page TEXT, -- Which page it originally came from
      source_metadata TEXT,
      scraping_method TEXT DEFAULT 'telegram',
      
      -- Performance tracking
      click_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      share_count_total INTEGER DEFAULT 0,
      
      -- Timestamps
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER,
      last_trending_check INTEGER,
      
      -- Display control
      display_pages TEXT DEFAULT 'top-picks',
      display_order INTEGER DEFAULT 0,
      priority_level INTEGER DEFAULT 1, -- 1-5, higher = more priority
      
      -- Additional fields for compatibility
      gender TEXT,
      content_type TEXT DEFAULT 'product',
      source TEXT DEFAULT 'telegram',
      
      -- Service/App compatibility
      is_service BOOLEAN DEFAULT 0,
      is_ai_app BOOLEAN DEFAULT 0,
      app_type TEXT,
      platform TEXT
    )
  `;
  
  db.exec(createTableSQL);
  console.log('Success top_picks_products table created successfully');
  
  // Create indexes for better performance
  console.log('Stats Creating indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_top_picks_category ON top_picks_products(category)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_created_at ON top_picks_products(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_status ON top_picks_products(processing_status)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_featured ON top_picks_products(is_featured)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_telegram ON top_picks_products(telegram_message_id)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_display ON top_picks_products(display_pages)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_viral ON top_picks_products(is_viral)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_trending ON top_picks_products(is_trending)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_limited ON top_picks_products(is_limited_deal)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_new_offer ON top_picks_products(is_new_offer)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_trend_score ON top_picks_products(trend_score)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_viral_score ON top_picks_products(viral_score)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_popularity ON top_picks_products(popularity_rank)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_urgency ON top_picks_products(deal_urgency_level)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_expires ON top_picks_products(deal_expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_flash ON top_picks_products(flash_sale)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_source_page ON top_picks_products(source_page)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_priority ON top_picks_products(priority_level)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_quality ON top_picks_products(quality_score)',
    'CREATE INDEX IF NOT EXISTS idx_top_picks_network ON top_picks_products(affiliate_network)'
  ];
  
  indexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  
  console.log('Success Indexes created successfully');
  
  // Insert test Top Picks products to verify table structure
  console.log('🧪 Inserting test Top Picks products...');
  
  const insertTestProduct = db.prepare(`
    INSERT INTO top_picks_products (
      name, description, price, original_price, currency,
      image_url, affiliate_url, original_url, category,
      rating, discount, affiliate_network, is_viral, is_trending,
      is_limited_deal, is_new_offer, trend_score, viral_score,
      popularity_rank, deal_urgency_level, flash_sale, source_page
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Test product 1: Viral trending product
  const viralProductId = insertTestProduct.run(
    'iPhone 15 Pro Max - Limited Flash Sale',
    'Latest iPhone with titanium design, A17 Pro chip, and advanced camera system. Flash sale ending soon!',
    '89999',
    '134900',
    'INR',
    'https://via.placeholder.com/300x300?text=iPhone15Pro',
    'https://amazon.in/iphone-15-pro-max?ref=topicks',
    'https://amazon.in/iphone-15-pro-max',
    'Electronics',
    '4.9',
    '33',
    'top-picks',
    '1', // is_viral
    '1', // is_trending
    '1', // is_limited_deal
    '0', // is_new_offer
    '95.5', // trend_score
    '88.2', // viral_score
    '1', // popularity_rank
    'critical', // deal_urgency_level
    '1', // flash_sale
    'prime-picks' // source_page
  ).lastInsertRowid;
  
  // Test product 2: New trending offer
  const newOfferId = insertTestProduct.run(
    'Samsung Galaxy S24 Ultra - New Launch Offer',
    'Revolutionary AI-powered smartphone with S Pen and 200MP camera. New launch special pricing!',
    '109999',
    '129999',
    'INR',
    'https://via.placeholder.com/300x300?text=GalaxyS24',
    'https://samsung.com/galaxy-s24-ultra?ref=topicks',
    'https://samsung.com/galaxy-s24-ultra',
    'Electronics',
    '4.8',
    '15',
    'top-picks',
    '0', // is_viral
    '1', // is_trending
    '0', // is_limited_deal
    '1', // is_new_offer
    '87.3', // trend_score
    '65.1', // viral_score
    '2', // popularity_rank
    'high', // deal_urgency_level
    '0', // flash_sale
    'click-picks' // source_page
  ).lastInsertRowid;
  
  // Test product 3: Limited deal trending
  const limitedDealId = insertTestProduct.run(
    'MacBook Air M3 - Limited Time Deal',
    'Powerful M3 chip, 18-hour battery life, and stunning Liquid Retina display. Limited stock available!',
    '99999',
    '119900',
    'INR',
    'https://via.placeholder.com/300x300?text=MacBookAir',
    'https://apple.com/macbook-air-m3?ref=topicks',
    'https://apple.com/macbook-air-m3',
    'Computers',
    '4.7',
    '17',
    'top-picks',
    '0', // is_viral
    '1', // is_trending
    '1', // is_limited_deal
    '0', // is_new_offer
    '82.7', // trend_score
    '71.4', // viral_score
    '3', // popularity_rank
    'high', // deal_urgency_level
    '0', // flash_sale
    'deals-hub' // source_page
  ).lastInsertRowid;
  
  console.log(`Success Test Top Picks created:`);
  console.log(`   Viral iPhone ID: ${viralProductId}`);
  console.log(`   New Galaxy ID: ${newOfferId}`);
  console.log(`   Limited MacBook ID: ${limitedDealId}`);
  
  // Verify table structure
  console.log('\nStats Table structure verification:');
  const tableInfo = db.prepare("PRAGMA table_info(top_picks_products)").all();
  console.log('Columns:', tableInfo.length);
  
  // Count total products
  const count = db.prepare('SELECT COUNT(*) as count FROM top_picks_products').get();
  console.log(`Total products: ${count.count}`);
  
  // Show trending products
  const trending = db.prepare('SELECT is_trending, COUNT(*) as count FROM top_picks_products GROUP BY is_trending').all();
  console.log('Trending products:', trending);
  
  // Show viral products
  const viral = db.prepare('SELECT is_viral, COUNT(*) as count FROM top_picks_products GROUP BY is_viral').all();
  console.log('Viral products:', viral);
  
  // Show limited deals
  const limited = db.prepare('SELECT is_limited_deal, COUNT(*) as count FROM top_picks_products GROUP BY is_limited_deal').all();
  console.log('Limited deals:', limited);
  
  // Show new offers
  const newOffers = db.prepare('SELECT is_new_offer, COUNT(*) as count FROM top_picks_products GROUP BY is_new_offer').all();
  console.log('New offers:', newOffers);
  
  // Show urgency levels
  const urgency = db.prepare('SELECT deal_urgency_level, COUNT(*) as count FROM top_picks_products GROUP BY deal_urgency_level').all();
  console.log('Urgency levels:', urgency);
  
  // Show source pages
  const sources = db.prepare('SELECT source_page, COUNT(*) as count FROM top_picks_products GROUP BY source_page').all();
  console.log('Source pages:', sources);
  
  console.log('\nCelebration Today\'s Top Picks database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Create TopPicksService class with trend detection algorithms');
  console.log('2. Add bot configuration to telegram-bot-registry.ts');
  console.log('3. Update .env with TOP_PICKS_BOT_TOKEN and TOP_PICKS_CHANNEL_ID');
  console.log('4. Update frontend to aggregate trending products from all pages');
  console.log('5. Implement viral/trending detection algorithms');
  console.log('6. Test autoposting with trend scoring and urgency detection');
  
  db.close();
  
} catch (error) {
  console.error('Error Error creating Top Picks table:', error);
  process.exit(1);
}