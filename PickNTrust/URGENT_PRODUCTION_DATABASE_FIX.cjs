#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

console.log('🚨 URGENT: Fixing missing canva_settings table in production...\n');

try {
  // Connect to the production database
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  console.log(`📁 Database path: ${dbPath}`);
  
  const db = new Database(dbPath);
  console.log('✅ Connected to production database');

  // Check if canva_settings table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='canva_settings'
  `).get();

  if (tableExists) {
    console.log('✅ canva_settings table already exists');
  } else {
    console.log('🔧 Creating canva_settings table...');
    
    // Create canva_settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS canva_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_enabled BOOLEAN DEFAULT 0,
        api_key TEXT,
        api_secret TEXT,
        default_template_id TEXT,
        auto_generate_captions BOOLEAN DEFAULT 1,
        auto_generate_hashtags BOOLEAN DEFAULT 1,
        default_caption TEXT,
        default_hashtags TEXT,
        platforms TEXT DEFAULT '[]',
        schedule_type TEXT DEFAULT 'immediate',
        schedule_delay_minutes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ canva_settings table created');

    // Insert default settings
    db.prepare(`
      INSERT INTO canva_settings (
        is_enabled, 
        auto_generate_captions, 
        auto_generate_hashtags,
        default_caption,
        default_hashtags,
        platforms, 
        schedule_type, 
        schedule_delay_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      0, // is_enabled = false initially
      1, // auto_generate_captions = true
      1, // auto_generate_hashtags = true
      '🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!',
      '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
      JSON.stringify(['instagram', 'facebook']), // default platforms
      'immediate',
      0
    );
    console.log('✅ Default canva_settings inserted');
  }

  // Check if canva_posts table exists
  const postsTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='canva_posts'
  `).get();

  if (!postsTableExists) {
    console.log('🔧 Creating canva_posts table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS canva_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        design_id TEXT,
        caption TEXT,
        hashtags TEXT,
        platforms TEXT,
        status TEXT DEFAULT 'pending',
        results TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ canva_posts table created');
  }

  // Check if canva_templates table exists
  const templatesTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='canva_templates'
  `).get();

  if (!templatesTableExists) {
    console.log('🔧 Creating canva_templates table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS canva_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'post',
        category TEXT,
        thumbnail_url TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ canva_templates table created');
  }

  // Verify tables exist
  const allTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN ('canva_settings', 'canva_posts', 'canva_templates')
    ORDER BY name
  `).all();

  console.log('\n📊 Verification - Tables created:');
  allTables.forEach(table => {
    console.log(`  ✅ ${table.name}`);
  });

  // Test canva_settings table
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
  console.log(`\n📈 canva_settings records: ${settingsCount.count}`);

  db.close();
  console.log('\n🎉 SUCCESS! Production database fixed.');
  console.log('🔄 Please restart your PM2 process:');
  console.log('   pm2 restart pickntrust');
  console.log('\n✅ The "no such table: canva_settings" error should now be resolved!');

} catch (error) {
  console.error('❌ Error fixing production database:', error);
  console.log('\n🔧 Manual fix instructions:');
  console.log('1. Connect to your database:');
  console.log('   sqlite3 database.sqlite');
  console.log('2. Run these commands:');
  console.log(`
CREATE TABLE IF NOT EXISTS canva_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_enabled BOOLEAN DEFAULT 0,
  api_key TEXT,
  api_secret TEXT,
  default_template_id TEXT,
  auto_generate_captions BOOLEAN DEFAULT 1,
  auto_generate_hashtags BOOLEAN DEFAULT 1,
  default_caption TEXT,
  default_hashtags TEXT,
  platforms TEXT DEFAULT '[]',
  schedule_type TEXT DEFAULT 'immediate',
  schedule_delay_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO canva_settings (is_enabled, auto_generate_captions, auto_generate_hashtags, default_caption, default_hashtags, platforms, schedule_type, schedule_delay_minutes) 
VALUES (0, 1, 1, '🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!', '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India', '["instagram","facebook"]', 'immediate', 0);
  `);
  process.exit(1);
}
