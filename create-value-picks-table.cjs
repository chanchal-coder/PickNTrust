// Create Value Picks products table with comprehensive schema
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('🔧 Creating value_picks_products table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS value_picks_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      original_price TEXT,
      currency TEXT DEFAULT 'INR',
      image_url TEXT,
      affiliate_url TEXT,
      category TEXT,
      rating TEXT,
      review_count INTEGER DEFAULT 0,
      discount INTEGER,
      is_featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      affiliate_network TEXT,
      telegram_message_id INTEGER,
      telegram_channel_id INTEGER,
      telegram_channel_name TEXT,
      click_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      processing_status TEXT DEFAULT 'active',
      expires_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      display_pages TEXT,
      source_metadata TEXT,
      tags TEXT,
      has_limited_offer INTEGER DEFAULT 0,
      limited_offer_text TEXT
    )
  `;
  
  db.exec(createTableSQL);
  console.log('Success Successfully created value_picks_products table');
  
  // Verify table creation
  const tableInfo = db.prepare("PRAGMA table_info(value_picks_products)").all();
  console.log(`📋 Table created with ${tableInfo.length} columns:`);
  tableInfo.forEach(col => {
    console.log(`   - ${col.name}: ${col.type}`);
  });
  
  db.close();
  console.log('Target Value Picks database setup complete!');
  
} catch (error) {
  console.error('Error Error creating Value Picks table:', error.message);
  process.exit(1);
}