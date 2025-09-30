const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Creating travel_picks_products table...');

// Create the missing travel_picks_products table
db.exec(`
  CREATE TABLE IF NOT EXISTS travel_picks_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT,
    original_price TEXT,
    currency TEXT DEFAULT 'INR',
    image_url TEXT,
    affiliate_url TEXT,
    category TEXT,
    rating TEXT,
    review_count INTEGER DEFAULT 0,
    discount INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    source TEXT DEFAULT 'telegram-travel-picks',
    telegram_message_id INTEGER,
    expires_at INTEGER,
    affiliate_link TEXT,
    display_pages TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    has_limited_offer INTEGER DEFAULT 0,
    limited_offer_text TEXT,
    message_group_id TEXT,
    product_sequence INTEGER,
    total_in_group INTEGER,
    content_type TEXT DEFAULT 'product',
    affiliate_network TEXT DEFAULT 'travel-multi',
    affiliate_tag_applied INTEGER DEFAULT 0,
    original_url TEXT,
    affiliate_config TEXT,
    processing_status TEXT DEFAULT 'processed',
    telegram_channel_id TEXT
  )
`);

console.log('✅ Created travel_picks_products table');

// Verify the table was created
const tableInfo = db.prepare("PRAGMA table_info(travel_picks_products)").all();
console.log(`Table has ${tableInfo.length} columns:`);
tableInfo.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

// Check if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM travel_picks_products').get();
console.log(`\nTable verification: ${count.count} records`);

db.close();
console.log('\n✅ Travel Picks table creation completed!');