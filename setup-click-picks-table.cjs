/**
 * Setup Click Picks Products Table
 * Creates the database table for Click Picks bot with CPC optimization fields
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🗄️ Setting up Click Picks products table...');

try {
  // Create click_picks_products table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS click_picks_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      original_price TEXT,
      currency TEXT DEFAULT 'INR',
      image_url TEXT,
      affiliate_url TEXT NOT NULL,
      original_url TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      rating REAL,
      review_count INTEGER,
      discount REAL,
      source TEXT DEFAULT 'click-picks-telegram',
      telegram_message_id INTEGER,
      telegram_channel_id INTEGER,
      affiliate_network TEXT NOT NULL,
      cpc_value REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createTableSQL);
  console.log('Success Click Picks products table created successfully');
  
  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_click_picks_created_at ON click_picks_products(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_click_picks_category ON click_picks_products(category)',
    'CREATE INDEX IF NOT EXISTS idx_click_picks_network ON click_picks_products(affiliate_network)',
    'CREATE INDEX IF NOT EXISTS idx_click_picks_cpc ON click_picks_products(cpc_value)'
  ];
  
  indexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  
  console.log('Success Click Picks indexes created successfully');
  
  // Check table structure
  const tableInfo = db.prepare("PRAGMA table_info(click_picks_products)").all();
  console.log('Stats Click Picks table structure:');
  tableInfo.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
  });
  
  // Insert a test product to verify table works
  const testProduct = {
    id: 'cp_test_' + Date.now(),
    name: 'Test Click Picks Product',
    description: 'Test product for Click Picks CPC optimization',
    price: '999',
    currency: 'INR',
    image_url: '/test-image.jpg',
    affiliate_url: 'https://linksredirect.com/?cid=243942&source=linkkit&url=https%3A//example.com',
    original_url: 'https://example.com/product',
    category: 'electronics',
    source: 'click-picks-telegram',
    telegram_message_id: 12345,
    telegram_channel_id: -1002981205504,
    affiliate_network: 'cuelinks',
    cpc_value: 0.15
  };
  
  const insertStmt = db.prepare(`
    INSERT INTO click_picks_products (
      id, name, description, price, currency, image_url,
      affiliate_url, original_url, category, source,
      telegram_message_id, telegram_channel_id,
      affiliate_network, cpc_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertStmt.run(
    testProduct.id,
    testProduct.name,
    testProduct.description,
    testProduct.price,
    testProduct.currency,
    testProduct.image_url,
    testProduct.affiliate_url,
    testProduct.original_url,
    testProduct.category,
    testProduct.source,
    testProduct.telegram_message_id,
    testProduct.telegram_channel_id,
    testProduct.affiliate_network,
    testProduct.cpc_value
  );
  
  console.log('Success Test product inserted successfully');
  
  // Verify the insert worked
  const count = db.prepare('SELECT COUNT(*) as count FROM click_picks_products').get();
  console.log(`Stats Total Click Picks products: ${count.count}`);
  
  // Show the test product
  const testResult = db.prepare('SELECT * FROM click_picks_products WHERE id = ?').get(testProduct.id);
  console.log('🧪 Test product details:');
  console.log(`   Name: ${testResult.name}`);
  console.log(`   Network: ${testResult.affiliate_network}`);
  console.log(`   CPC: $${testResult.cpc_value}`);
  console.log(`   Created: ${testResult.created_at}`);
  
} catch (error) {
  console.error('Error Error setting up Click Picks table:', error);
} finally {
  db.close();
  console.log('🔒 Database connection closed');
}

console.log('\nCelebration Click Picks table setup complete!');
console.log('AI The Click Picks bot can now save products with CPC optimization');
console.log('Price Multi-affiliate network support: CueLinks, INRDeals, EarnKaro');