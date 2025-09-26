const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('Creating RSS feeds table...');
  
  // Create the rss_feeds table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT,
      category TEXT,
      update_frequency INTEGER DEFAULT 60, -- minutes
      last_fetched DATETIME,
      is_active BOOLEAN DEFAULT 1,
      auto_import BOOLEAN DEFAULT 1,
      content_filter TEXT, -- JSON string for filtering rules
      affiliate_replace BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createTableQuery);
  console.log('✅ RSS feeds table created successfully');
  
  // Check if table was created
  const tableInfo = db.prepare("PRAGMA table_info(rss_feeds)").all();
  console.log('\n📋 RSS feeds table structure:');
  tableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
  });
  
  // Insert some sample RSS feeds for testing
  console.log('\n🌱 Adding sample RSS feeds...');
  
  const insertSample = db.prepare(`
    INSERT OR IGNORE INTO rss_feeds (name, url, description, category, update_frequency, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const sampleFeeds = [
    {
      name: 'TechCrunch Deals',
      url: 'https://techcrunch.com/category/startups/feed/',
      description: 'Latest tech deals and startup news',
      category: 'Technology',
      frequency: 30,
      active: 1
    },
    {
      name: 'Slickdeals Hot Deals',
      url: 'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1',
      description: 'Hot deals from Slickdeals community',
      category: 'Deals',
      frequency: 15,
      active: 1
    },
    {
      name: 'RetailMeNot Coupons',
      url: 'https://www.retailmenot.com/blog/feed/',
      description: 'Latest coupons and savings tips',
      category: 'Coupons',
      frequency: 60,
      active: 0
    }
  ];
  
  sampleFeeds.forEach(feed => {
    try {
      insertSample.run(feed.name, feed.url, feed.description, feed.category, feed.frequency, feed.active);
      console.log(`  ✅ Added: ${feed.name}`);
    } catch (error) {
      console.log(`  ⚠️  Skipped: ${feed.name} (already exists)`);
    }
  });
  
  // Verify the data
  const count = db.prepare("SELECT COUNT(*) as count FROM rss_feeds").get();
  console.log(`\n📊 Total RSS feeds in database: ${count.count}`);
  
  // Show all feeds
  const allFeeds = db.prepare("SELECT id, name, url, category, is_active FROM rss_feeds ORDER BY id").all();
  console.log('\n📋 Current RSS feeds:');
  allFeeds.forEach(feed => {
    console.log(`  ${feed.id}. ${feed.name} (${feed.category}) - ${feed.is_active ? 'Active' : 'Inactive'}`);
    console.log(`     URL: ${feed.url}`);
  });
  
} catch (error) {
  console.error('❌ Error creating RSS feeds table:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('\n✅ Database connection closed');
}