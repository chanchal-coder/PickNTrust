const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 FINAL SQLite Error Fix - Creating Canva Tables...\n');

try {
  // Determine which database file to use
  const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
  console.log(`Upload Using database file: ${dbFile}`);
  
  const db = new Database(dbFile);
  
  // Create canva_settings table
  console.log('📋 Creating canva_settings table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS canva_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      is_enabled INTEGER DEFAULT 0,
      api_key TEXT,
      api_secret TEXT,
      default_template_id TEXT,
      auto_generate_captions INTEGER DEFAULT 1,
      auto_generate_hashtags INTEGER DEFAULT 1,
      default_caption TEXT,
      default_hashtags TEXT,
      platforms TEXT DEFAULT '[]',
      schedule_type TEXT DEFAULT 'immediate',
      schedule_delay_minutes INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  // Create canva_posts table
  console.log('📋 Creating canva_posts table...');
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
  
  // Create canva_templates table
  console.log('📋 Creating canva_templates table...');
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
  
  // Check if default settings exist
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
  
  if (existingSettings.count === 0) {
    console.log('Blog Creating default Canva settings...');
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
      'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!',
      '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
      JSON.stringify(['instagram', 'facebook']), // default platforms
      'immediate',
      0,
      Math.floor(Date.now() / 1000), // created_at timestamp
      Math.floor(Date.now() / 1000)  // updated_at timestamp
    );
    console.log('Success Default settings created');
  } else {
    console.log('ℹ️  Default settings already exist');
  }
  
  // Verify tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE 'canva_%'
    ORDER BY name
  `).all();
  
  console.log('\nStats Canva tables in database:');
  tables.forEach(table => {
    console.log(`  Success ${table.name}`);
  });
  
  // Test the settings table
  const settings = db.prepare('SELECT * FROM canva_settings LIMIT 1').get();
  console.log('\n🧪 Test query result:');
  console.log('  Settings found:', settings ? 'YES' : 'NO');
  if (settings) {
    console.log('  ID:', settings.id);
    console.log('  Enabled:', Boolean(settings.is_enabled));
    console.log('  Auto captions:', Boolean(settings.auto_generate_captions));
    console.log('  Auto hashtags:', Boolean(settings.auto_generate_hashtags));
  }
  
  db.close();
  
  console.log('\nCelebration SUCCESS! All Canva tables created and verified.');
  console.log('Success The SQLite error should now be resolved.');
  console.log('\n📋 Next steps:');
  console.log('1. Restart the server: pm2 restart pickntrust');
  console.log('2. Test the admin automation panel');
  
} catch (error) {
  console.error('Error Error creating Canva tables:', error);
  console.log('\nSearch Troubleshooting:');
  console.log('1. Check if the database file exists');
  console.log('2. Verify file permissions');
  console.log('3. Ensure better-sqlite3 is installed');
}
