// Create Global Picks Products Database Table
// Universal URL support with same features as other picks tables

const Database = require('better-sqlite3');

console.log('🌍 CREATING GLOBAL PICKS DATABASE TABLE');
console.log('=' .repeat(60));
console.log('Target Purpose: Create global_picks_products table for universal URL support');
console.log('Stats Features: Same structure as other picks + universal affiliate support');
console.log('Link URL Support: All types (Amazon, Flipkart, Shopsy, EarnKaro, Cuelinks, etc.)');
console.log('=' .repeat(60));

async function createGlobalPicksTable() {
  try {
    console.log('\n1. 🗄️ Connecting to Database...');
    
    const db = new Database('database.sqlite');
    
    console.log('\n2. 🏗️ Creating Global Picks Products Table...');
    
    // Create global_picks_products table with comprehensive structure
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS global_picks_products (
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
      affiliate_network TEXT DEFAULT 'global-picks',
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
      
      -- Universal scraping fields
      source_domain TEXT,
      source_metadata TEXT,
      scraping_method TEXT DEFAULT 'universal',
      
      -- Performance tracking
      click_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      
      -- Timestamps
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER,
      
      -- Display control
      display_pages TEXT DEFAULT 'global-picks',
      display_order INTEGER DEFAULT 0,
      
      -- Additional fields for compatibility
      gender TEXT,
      content_type TEXT DEFAULT 'product',
      source TEXT DEFAULT 'telegram'
    )
  `;
  
  db.exec(createTableSQL);
  console.log('Success global_picks_products table created successfully');
  
  // Create indexes for better performance
  console.log('Stats Creating indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_global_picks_category ON global_picks_products(category)',
    'CREATE INDEX IF NOT EXISTS idx_global_picks_created_at ON global_picks_products(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_global_picks_status ON global_picks_products(processing_status)',
    'CREATE INDEX IF NOT EXISTS idx_global_picks_featured ON global_picks_products(is_featured)',
    'CREATE INDEX IF NOT EXISTS idx_global_picks_telegram ON global_picks_products(telegram_message_id)',
    'CREATE INDEX IF NOT EXISTS idx_global_picks_display ON global_picks_products(display_pages)',
    'CREATE INDEX IF NOT EXISTS idx_global_picks_source ON global_picks_products(source_domain)',
    'CREATE INDEX IF NOT EXISTS idx_global_picks_network ON global_picks_products(affiliate_network)'
  ];
  
  indexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  
  console.log('Success Indexes created successfully');
  
  // Insert a test product to verify table structure
  console.log('🧪 Inserting test Global Picks product...');
  
  const insertTestProduct = db.prepare(`
    INSERT INTO global_picks_products (
      name, description, price, original_price, currency,
      image_url, affiliate_url, original_url, category,
      rating, discount, affiliate_network, source_domain,
      scraping_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const testProductId = insertTestProduct.run(
    'Global Picks Test Product',
    'Universal product from any e-commerce site with automatic affiliate tagging',
    '2999',
    '3999',
    'INR',
    'https://via.placeholder.com/300x300?text=Global+Picks',
    'https://example.com/affiliate/test-product?tag=pickntrust-21',
    'https://example.com/test-product',
    'Electronics',
    '4.5',
    '25',
    'global-picks',
    'example.com',
    'universal'
  ).lastInsertRowid;
  
  console.log(`Success Test product created with ID: ${testProductId}`);
  
  // Verify table structure
  console.log('\nStats Table structure verification:');
  const tableInfo = db.prepare("PRAGMA table_info(global_picks_products)").all();
  console.log('Columns:', tableInfo.length);
  
  // Count total products
  const count = db.prepare('SELECT COUNT(*) as count FROM global_picks_products').get();
  console.log(`Total products: ${count.count}`);
  
  console.log('\nCelebration Global Picks database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Create GlobalPicksService class');
  console.log('2. Add bot configuration to telegram-bot-registry.ts');
  console.log('3. Update .env with GLOBAL_PICKS_BOT_TOKEN and GLOBAL_PICKS_CHANNEL_ID');
  console.log('4. Implement universal URL scraping functionality');
  console.log('5. Test autoposting with any e-commerce URL');
    
    console.log('\nCelebration GLOBAL PICKS DATABASE READY!');
    console.log('Special Universal URL support with advanced features!');
    
  } catch (error) {
    console.error('Error Error creating Global Picks table:', error.message);
  }
}

// Run the database setup
createGlobalPicksTable().catch(console.error);