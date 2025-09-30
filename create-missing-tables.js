import Database from 'better-sqlite3';

const db = new Database('database.db');

try {
  console.log('Creating missing tables...');

  // Create channel_posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      channel_name TEXT NOT NULL,
      message_id INTEGER NOT NULL,
      content TEXT,
      media_urls TEXT,
      affiliate_urls TEXT,
      original_urls TEXT,
      platform TEXT NOT NULL,
      post_type TEXT DEFAULT 'text',
      engagement_metrics TEXT,
      processed_at INTEGER DEFAULT (strftime('%s', 'now')),
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      is_processed INTEGER DEFAULT 0,
      processing_status TEXT DEFAULT 'pending'
    )
  `);

  // Create affiliate_conversions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      channel_post_id INTEGER,
      original_url TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      platform TEXT NOT NULL,
      conversion_success INTEGER NOT NULL,
      conversion_error TEXT,
      click_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      revenue TEXT DEFAULT '0',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (channel_post_id) REFERENCES channel_posts(id) ON UPDATE no action ON DELETE no action
    )
  `);

  // Create unified_content table
  db.exec(`
    CREATE TABLE IF NOT EXISTS unified_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      content_type TEXT NOT NULL,
      source_platform TEXT NOT NULL,
      source_id TEXT,
      media_urls TEXT,
      affiliate_urls TEXT,
      original_urls TEXT,
      tags TEXT,
      category TEXT,
      engagement_metrics TEXT,
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT,
      featured_image TEXT,
      status TEXT DEFAULT 'draft',
      visibility TEXT DEFAULT 'public',
      scheduled_at INTEGER,
      published_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      metadata TEXT,
      processing_status TEXT DEFAULT 'pending',
      ai_generated INTEGER DEFAULT 0
    )
  `);

  console.log('Tables created successfully!');

  // Verify tables were created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('All tables now:', tables.map(t => t.name));

} catch (error) {
  console.error('Error creating tables:', error.message);
} finally {
  db.close();
}