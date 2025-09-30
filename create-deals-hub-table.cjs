const Database = require('better-sqlite3');

console.log('🏪 Creating Deals Hub products table...');

try {
  const db = new Database('database.sqlite');
  
  // Create deals_hub_products table with comprehensive schema
  console.log('📋 Creating deals_hub_products table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS deals_hub_products (
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
      affiliate_network TEXT DEFAULT 'deals-hub',
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
      
      -- Deals Hub specific fields
      deal_type TEXT DEFAULT 'general', -- 'flash', 'daily', 'weekly', 'clearance', 'general'
      deal_priority INTEGER DEFAULT 0, -- Higher number = higher priority
      deal_start_time INTEGER,
      deal_end_time INTEGER,
      stock_quantity INTEGER,
      max_quantity_per_user INTEGER DEFAULT 1,
      
      -- Source tracking
      source_domain TEXT,
      source_metadata TEXT,
      scraping_method TEXT DEFAULT 'telegram',
      
      -- Performance tracking
      click_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      
      -- Timestamps
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER,
      
      -- Display control
      display_pages TEXT DEFAULT 'deals-hub',
      display_order INTEGER DEFAULT 0,
      
      -- Additional fields for compatibility
      gender TEXT,
      content_type TEXT DEFAULT 'product',
      source TEXT DEFAULT 'telegram'
    )
  `;
  
  db.exec(createTableSQL);
  console.log('Success deals_hub_products table created successfully');
  
  // Create indexes for better performance
  console.log('Stats Creating indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_category ON deals_hub_products(category)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_created_at ON deals_hub_products(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_status ON deals_hub_products(processing_status)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_featured ON deals_hub_products(is_featured)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_telegram ON deals_hub_products(telegram_message_id)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_display ON deals_hub_products(display_pages)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_deal_type ON deals_hub_products(deal_type)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_priority ON deals_hub_products(deal_priority)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_network ON deals_hub_products(affiliate_network)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_expires ON deals_hub_products(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_deals_hub_deal_end ON deals_hub_products(deal_end_time)'
  ];
  
  indexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  
  console.log('Success Indexes created successfully');
  
  // Insert test products to verify table structure
  console.log('🧪 Inserting test Deals Hub products...');
  
  const insertTestProduct = db.prepare(`
    INSERT INTO deals_hub_products (
      name, description, price, original_price, currency,
      image_url, affiliate_url, original_url, category,
      rating, discount, affiliate_network, deal_type,
      deal_priority, has_limited_offer, limited_offer_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Test product 1: Flash Deal
  const flashDealId = insertTestProduct.run(
    'Flash Deal - Premium Headphones',
    'Limited time flash deal on premium wireless headphones with noise cancellation',
    '1999',
    '4999',
    'INR',
    'https://via.placeholder.com/300x300?text=Flash+Deal',
    'https://example.com/affiliate/headphones?tag=pickntrust-21',
    'https://example.com/headphones',
    'Electronics',
    '4.8',
    '60',
    'deals-hub',
    'flash',
    '10', // High priority
    '1',
    'Flash Sale - 60% OFF!'
  ).lastInsertRowid;
  
  // Test product 2: Daily Deal
  const dailyDealId = insertTestProduct.run(
    'Daily Deal - Smart Watch',
    'Today only - Premium smartwatch with health monitoring features',
    '2499',
    '3999',
    'INR',
    'https://via.placeholder.com/300x300?text=Daily+Deal',
    'https://example.com/affiliate/smartwatch?tag=pickntrust-21',
    'https://example.com/smartwatch',
    'Electronics',
    '4.5',
    '38',
    'deals-hub',
    'daily',
    '8', // Medium-high priority
    '1',
    'Daily Deal - 38% OFF!'
  ).lastInsertRowid;
  
  // Test product 3: Clearance Sale
  const clearanceId = insertTestProduct.run(
    'Clearance - Fashion Accessories',
    'End of season clearance sale on premium fashion accessories',
    '599',
    '1299',
    'INR',
    'https://via.placeholder.com/300x300?text=Clearance',
    'https://example.com/affiliate/accessories?tag=pickntrust-21',
    'https://example.com/accessories',
    'Fashion',
    '4.2',
    '54',
    'deals-hub',
    'clearance',
    '5', // Medium priority
    '1',
    'Clearance Sale - 54% OFF!'
  ).lastInsertRowid;
  
  console.log(`Success Test products created:`);
  console.log(`   Flash Deal ID: ${flashDealId}`);
  console.log(`   Daily Deal ID: ${dailyDealId}`);
  console.log(`   Clearance ID: ${clearanceId}`);
  
  // Verify table structure
  console.log('\nStats Table structure verification:');
  const tableInfo = db.prepare("PRAGMA table_info(deals_hub_products)").all();
  console.log('Columns:', tableInfo.length);
  
  // Count total products
  const count = db.prepare('SELECT COUNT(*) as count FROM deals_hub_products').get();
  console.log(`Total products: ${count.count}`);
  
  // Show deal types
  const dealTypes = db.prepare('SELECT deal_type, COUNT(*) as count FROM deals_hub_products GROUP BY deal_type').all();
  console.log('Deal types:', dealTypes);
  
  console.log('\nCelebration Deals Hub database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Create DealsHubService class');
  console.log('2. Add bot configuration to telegram-bot-registry.ts');
  console.log('3. Update .env with DEALS_HUB_BOT_TOKEN and DEALS_HUB_CHANNEL_ID');
  console.log('4. Implement deal-specific features (flash deals, daily deals, etc.)');
  console.log('5. Test autoposting with deal URLs');
  
  db.close();
  
} catch (error) {
  console.error('Error Error creating Deals Hub table:', error);
  process.exit(1);
}