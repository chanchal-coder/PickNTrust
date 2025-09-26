const Database = require('better-sqlite3');

try {
  console.log('Opening database...');
  const db = new Database('sqlite.db');
  
  // First, let's see what tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Existing tables:', tables.map(t => t.name));
  
  // Check if channel_posts table exists
  const channelPostsExists = tables.some(t => t.name === 'channel_posts');
  console.log('channel_posts table exists:', channelPostsExists);
  
  // If channel_posts doesn't exist, create it
  if (!channelPostsExists) {
    console.log('Creating channel_posts table...');
    db.exec(`
      CREATE TABLE "channel_posts" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "channel_id" text NOT NULL,
        "channel_name" text NOT NULL,
        "website_page" text NOT NULL,
        "message_id" integer NOT NULL,
        "original_text" text NOT NULL,
        "processed_text" text NOT NULL,
        "extracted_urls" text,
        "is_processed" integer DEFAULT 0,
        "is_posted" integer DEFAULT 0,
        "processing_error" text,
        "telegram_timestamp" integer,
        "processed_at" integer,
        "posted_at" integer,
        "created_at" integer DEFAULT (strftime('%s', 'now'))
      );
    `);
    console.log('channel_posts table created successfully');
  }
  
  // Check categories table structure
  const categoriesInfo = db.prepare("PRAGMA table_info(categories)").all();
  console.log('Categories table columns:', categoriesInfo.map(c => c.name));
  
  // Check if missing columns exist
  const hasDisplayOrder = categoriesInfo.some(c => c.name === 'display_order');
  const hasIsForProducts = categoriesInfo.some(c => c.name === 'is_for_products');
  const hasIsForServices = categoriesInfo.some(c => c.name === 'is_for_services');
  const hasIsForAIApps = categoriesInfo.some(c => c.name === 'is_for_ai_apps');
  
  console.log('Categories missing columns check:');
  console.log('- display_order:', !hasDisplayOrder ? 'MISSING' : 'exists');
  console.log('- is_for_products:', !hasIsForProducts ? 'MISSING' : 'exists');
  console.log('- is_for_services:', !hasIsForServices ? 'MISSING' : 'exists');
  console.log('- is_for_ai_apps:', !hasIsForAIApps ? 'MISSING' : 'exists');
  
  // Add missing columns to categories table
  if (!hasDisplayOrder) {
    console.log('Adding display_order column...');
    db.exec('ALTER TABLE categories ADD COLUMN display_order integer DEFAULT 0');
  }
  
  if (!hasIsForProducts) {
    console.log('Adding is_for_products column...');
    db.exec('ALTER TABLE categories ADD COLUMN is_for_products integer DEFAULT 1');
  }
  
  if (!hasIsForServices) {
    console.log('Adding is_for_services column...');
    db.exec('ALTER TABLE categories ADD COLUMN is_for_services integer DEFAULT 0');
  }
  
  if (!hasIsForAIApps) {
    console.log('Adding is_for_ai_apps column...');
    db.exec('ALTER TABLE categories ADD COLUMN is_for_ai_apps integer DEFAULT 0');
  }
  
  console.log('Database schema fixes completed successfully!');
  
  db.close();
  
} catch (error) {
  console.error('Error fixing database schema:', error.message);
  process.exit(1);
}