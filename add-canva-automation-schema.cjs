const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { sql } = require('drizzle-orm');

// Initialize database connection
const sqlite = new Database('./database.sqlite');
const db = drizzle(sqlite);

async function addCanvaAutomationSchema() {
  console.log('🎨 Adding Canva Automation Schema...');
  
  try {
    // Create canva_settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS canva_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_enabled INTEGER DEFAULT 0,
        api_key TEXT,
        api_secret TEXT,
        default_template_id TEXT,
        auto_generate_captions INTEGER DEFAULT 1,
        auto_generate_hashtags INTEGER DEFAULT 1,
        platforms TEXT DEFAULT '[]', -- JSON array of enabled platforms
        schedule_type TEXT DEFAULT 'immediate', -- 'immediate' or 'scheduled'
        schedule_delay_minutes INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create canva_posts table to track generated content
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS canva_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type TEXT NOT NULL, -- 'product', 'service', 'blog', 'video'
        content_id INTEGER NOT NULL,
        canva_design_id TEXT,
        template_id TEXT,
        caption TEXT,
        hashtags TEXT,
        platforms TEXT, -- JSON array of platforms posted to
        post_urls TEXT, -- JSON object with platform URLs
        status TEXT DEFAULT 'pending', -- 'pending', 'posted', 'failed', 'expired'
        scheduled_at INTEGER,
        posted_at INTEGER,
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create canva_templates table for template management
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS canva_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'post', 'story', 'reel', 'short'
        category TEXT, -- 'product', 'service', 'blog', 'video'
        thumbnail_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Insert default Canva settings
    await db.run(sql`
      INSERT OR IGNORE INTO canva_settings (id, is_enabled, platforms, auto_generate_captions, auto_generate_hashtags)
      VALUES (1, 0, '["instagram", "facebook", "whatsapp", "telegram"]', 1, 1)
    `);

    console.log('Success Canva Automation Schema created successfully!');
    console.log('📋 Tables created:');
    console.log('   - canva_settings (automation configuration)');
    console.log('   - canva_posts (tracking generated content)');
    console.log('   - canva_templates (template management)');
    
  } catch (error) {
    console.error('Error Error creating Canva Automation Schema:', error);
    throw error;
  }
}

// Run the migration
addCanvaAutomationSchema()
  .then(() => {
    console.log('Celebration Canva Automation Schema migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
