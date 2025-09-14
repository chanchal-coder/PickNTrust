const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Target Creating CueLinks products table...');

try {
  // Create cuelinks_products table similar to telegram_products
  const createCuelinksTable = `
    CREATE TABLE IF NOT EXISTS cuelinks_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      currency TEXT DEFAULT 'INR',
      image_url TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      cuelinks_url TEXT, -- CueLinks specific URL
      original_url TEXT, -- Original product URL before CueLinks conversion
      category TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 4.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      discount INTEGER, -- percentage
      is_featured INTEGER DEFAULT 0, -- 0 or 1 for boolean
      
      -- CueLinks specific fields
      cuelinks_cid TEXT DEFAULT '243942',
      affiliate_network TEXT DEFAULT 'cuelinks',
      commission_rate REAL,
      
      -- Telegram integration fields
      telegram_message_id INTEGER,
      telegram_channel_id INTEGER DEFAULT -1003064466091,
      telegram_channel_name TEXT DEFAULT 'PNT Cuelinks',
      
      -- Tracking fields
      click_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      
      -- Status and timing
      processing_status TEXT DEFAULT 'active', -- active, expired, disabled
      expires_at INTEGER, -- Unix timestamp
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      
      -- Display configuration
      display_pages TEXT DEFAULT '["cue-picks"]', -- JSON array of pages
      
      -- Additional metadata
      source_metadata TEXT, -- JSON for additional CueLinks data
      tags TEXT -- JSON array for product tags
    )
  `;
  
  db.exec(createCuelinksTable);
  console.log('Success Created cuelinks_products table');
  
  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_category ON cuelinks_products(category)',
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_created_at ON cuelinks_products(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_expires_at ON cuelinks_products(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_telegram_channel ON cuelinks_products(telegram_channel_id)',
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_status ON cuelinks_products(processing_status)',
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_featured ON cuelinks_products(is_featured)',
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_price ON cuelinks_products(price)',
    'CREATE INDEX IF NOT EXISTS idx_cuelinks_products_rating ON cuelinks_products(rating)'
  ];
  
  indexes.forEach((indexQuery, i) => {
    try {
      db.exec(indexQuery);
      console.log(`Success ${i + 1}. Created index: ${indexQuery.match(/idx_\w+/)?.[0] || 'unknown'}`);
    } catch (error) {
      console.log(`Warning ${i + 1}. Index might already exist: ${error.message}`);
    }
  });
  
  // Insert sample CueLinks product for testing
  const insertSample = db.prepare(`
    INSERT OR IGNORE INTO cuelinks_products (
      id, name, description, price, original_price, currency,
      image_url, affiliate_url, cuelinks_url, original_url,
      category, rating, review_count, discount, is_featured,
      cuelinks_cid, affiliate_network, telegram_channel_id,
      display_pages, created_at
    ) VALUES (
      1, 
      'Sample CueLinks Product',
      'This is a sample product from CueLinks for testing purposes.',
      999.00,
      1299.00,
      'INR',
      'https://via.placeholder.com/300x300?text=CueLinks+Sample',
      'https://linksredirect.com/?cid=243942&source=linkkit&url=https%3A//example.com/product',
      'https://linksredirect.com/?cid=243942&source=linkkit&url=https%3A//example.com/product',
      'https://example.com/product',
      'Electronics',
      4.5,
      150,
      23,
      1,
      '243942',
      'cuelinks',
      -1003064466091,
      '["cue-picks"]',
      strftime('%s', 'now')
    )
  `);
  
  const result = insertSample.run();
  if (result.changes > 0) {
    console.log('Success Inserted sample CueLinks product');
  } else {
    console.log('ℹ️ Sample product already exists');
  }
  
  // Verify table structure
  console.log('\nSearch Verifying cuelinks_products table structure...');
  const tableInfo = db.prepare('PRAGMA table_info(cuelinks_products)').all();
  
  console.log('Stats Table columns:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Check current data
  const count = db.prepare('SELECT COUNT(*) as count FROM cuelinks_products').get();
  console.log(`\n📈 Current CueLinks products count: ${count.count}`);
  
  if (count.count > 0) {
    const sample = db.prepare('SELECT id, name, category, price, currency, affiliate_network FROM cuelinks_products LIMIT 3').all();
    console.log('\n📋 Sample products:');
    sample.forEach(product => {
      console.log(`   ${product.id}. ${product.name} - ${product.currency} ${product.price} (${product.category}) [${product.affiliate_network}]`);
    });
  }
  
  console.log('\nSuccess CueLinks products table setup completed successfully!');
  console.log('\nTarget Benefits of separate cuelinks_products table:');
  console.log('   - Better performance with dedicated indexes');
  console.log('   - Clean separation from main products');
  console.log('   - CueLinks-specific fields and metadata');
  console.log('   - Independent expiration and status management');
  console.log('   - Optimized for Telegram integration');
  console.log('   - Easy backup and maintenance');
  
} catch (error) {
  console.error('Error Error creating CueLinks products table:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}