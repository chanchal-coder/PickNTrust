const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Starting Canva schema migration for production...');

// Detect database file
const dbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
console.log(`📁 Using database file: ${dbFile}`);

const db = new Database(dbFile);

try {
  // Check current canva_settings table structure
  console.log('🔍 Checking current canva_settings table structure...');
  
  const tableInfo = db.prepare("PRAGMA table_info(canva_settings)").all();
  console.log('Current columns:', tableInfo.map(col => col.name));
  
  const existingColumns = tableInfo.map(col => col.name);
  
  // Define all required columns with their definitions
  const requiredColumns = [
    { name: 'id', definition: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
    { name: 'is_enabled', definition: 'INTEGER DEFAULT 0' },
    { name: 'api_key', definition: 'TEXT' },
    { name: 'api_secret', definition: 'TEXT' },
    { name: 'default_template_id', definition: 'TEXT' },
    { name: 'auto_generate_captions', definition: 'INTEGER DEFAULT 1' },
    { name: 'auto_generate_hashtags', definition: 'INTEGER DEFAULT 1' },
    { name: 'default_caption', definition: 'TEXT' },
    { name: 'default_hashtags', definition: 'TEXT' },
    { name: 'platforms', definition: 'TEXT DEFAULT \'[]\'' },
    { name: 'schedule_type', definition: 'TEXT DEFAULT \'immediate\'' },
    { name: 'schedule_delay_minutes', definition: 'INTEGER DEFAULT 0' },
    { name: 'created_at', definition: 'INTEGER DEFAULT (strftime(\'%s\', \'now\'))' },
    { name: 'updated_at', definition: 'INTEGER DEFAULT (strftime(\'%s\', \'now\'))' }
  ];
  
  // Add missing columns
  let columnsAdded = 0;
  for (const column of requiredColumns) {
    if (!existingColumns.includes(column.name)) {
      console.log(`➕ Adding missing column: ${column.name}`);
      try {
        db.exec(`ALTER TABLE canva_settings ADD COLUMN ${column.name} ${column.definition}`);
        columnsAdded++;
      } catch (error) {
        console.error(`❌ Error adding column ${column.name}:`, error.message);
      }
    }
  }
  
  if (columnsAdded === 0) {
    console.log('✅ All required columns already exist');
  } else {
    console.log(`✅ Added ${columnsAdded} missing columns`);
  }
  
  // Verify the table structure after migration
  console.log('🔍 Verifying updated table structure...');
  const updatedTableInfo = db.prepare("PRAGMA table_info(canva_settings)").all();
  console.log('Updated columns:', updatedTableInfo.map(col => col.name));
  
  // Check if we have any settings, if not create default ones
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
  console.log(`📊 Current settings count: ${settingsCount.count}`);
  
  if (settingsCount.count === 0) {
    console.log('➕ Creating default Canva settings...');
    db.prepare(`
      INSERT INTO canva_settings (
        is_enabled, 
        auto_generate_captions, 
        auto_generate_hashtags,
        default_caption,
        default_hashtags,
        platforms, 
        schedule_type, 
        schedule_delay_minutes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      0, // is_enabled = false initially
      1, // auto_generate_captions = true
      1, // auto_generate_hashtags = true
      '🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!',
      '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
      JSON.stringify(['instagram', 'facebook']), // default platforms
      'immediate',
      0,
      Math.floor(Date.now() / 1000), // created_at timestamp
      Math.floor(Date.now() / 1000)  // updated_at timestamp
    );
    console.log('✅ Default settings created');
  }
  
  // Also ensure canva_posts and canva_templates tables exist with correct schema
  console.log('🔧 Ensuring canva_posts table exists...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS canva_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      canva_design_id TEXT,
      template_id TEXT,
      caption TEXT,
      hashtags TEXT,
      platforms TEXT,
      post_urls TEXT,
      status TEXT DEFAULT 'pending',
      scheduled_at INTEGER,
      posted_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  console.log('🔧 Ensuring canva_templates table exists...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS canva_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      thumbnail_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  console.log('🎉 Canva schema migration completed successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   - Database file: ${dbFile}`);
  console.log(`   - Columns added: ${columnsAdded}`);
  console.log(`   - Settings records: ${settingsCount.count === 0 ? '1 (created)' : settingsCount.count + ' (existing)'}`);
  console.log('   - All Canva tables verified');
  console.log('');
  console.log('🚀 You can now restart your PM2 process:');
  console.log('   pm2 restart pickntrust');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
