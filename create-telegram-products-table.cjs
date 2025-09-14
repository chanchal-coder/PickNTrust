const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Creating separate Telegram products table...');

try {
  // Create a dedicated table for Telegram products
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT DEFAULT '0',
      original_price TEXT,
      currency TEXT DEFAULT 'INR',
      image_url TEXT DEFAULT 'https://via.placeholder.com/300x300',
      affiliate_url TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      rating TEXT DEFAULT '4.0',
      review_count INTEGER DEFAULT 0,
      discount INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      source TEXT DEFAULT 'telegram-prime-picks',
      telegram_message_id INTEGER,
      expires_at INTEGER,
      affiliate_link TEXT,
      display_pages TEXT DEFAULT '["prime-picks"]',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('Success Telegram products table created successfully!');

  // Check if table exists and show structure
  const tableInfo = db.prepare("PRAGMA table_info(telegram_products)").all();
  console.log('\n📋 Table structure:');
  tableInfo.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
  });

  // Test insertion
  console.log('\n🧪 Testing table insertion...');
  const testInsert = db.prepare(`
    INSERT INTO telegram_products (
      name, description, price, affiliate_url, category, telegram_message_id, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const testResult = testInsert.run(
    'Test Telegram Product',
    'This is a test product from Telegram integration',
    '999',
    'https://amazon.in/dp/TEST123?tag=pickntrust03-21',
    'Electronics',
    999999,
    Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
  );

  console.log(`Success Test product inserted with ID: ${testResult.lastInsertRowid}`);

  // Test selection
  const testSelect = db.prepare('SELECT * FROM telegram_products WHERE id = ?').get(testResult.lastInsertRowid);
  console.log('\n📋 Test product data:');
  console.log(JSON.stringify(testSelect, null, 2));

  // Clean up test data
  db.prepare('DELETE FROM telegram_products WHERE id = ?').run(testResult.lastInsertRowid);
  console.log('\nCleanup Test data cleaned up');

  console.log('\nCelebration Telegram products table is ready for use!');
  console.log('\nBlog Next steps:');
  console.log('1. Update telegram-integration.ts to use this new table');
  console.log('2. Update API endpoints to query both tables');
  console.log('3. Test the integration with real Telegram messages');

} catch (error) {
  console.error('Error Error creating Telegram products table:', error);
  process.exit(1);
} finally {
  db.close();
}