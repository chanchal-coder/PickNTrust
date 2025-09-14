const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Creating missing Canva automation tables in production...');

// Connect to the production database
const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log(`Upload Database path: ${dbPath}`);

const db = new Database(dbPath);

try {
  // Create canva_settings table
  console.log('📋 Creating canva_settings table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS canva_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      is_enabled BOOLEAN DEFAULT FALSE,
      platforms TEXT DEFAULT '["instagram", "facebook", "whatsapp", "telegram"]',
      auto_generate_captions BOOLEAN DEFAULT TRUE,
      auto_generate_hashtags BOOLEAN DEFAULT TRUE,
      schedule_type TEXT DEFAULT 'immediate',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create canva_posts table
  console.log('📋 Creating canva_posts table...');
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
      posted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create canva_templates table
  console.log('📋 Creating canva_templates table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS canva_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'post',
      category TEXT,
      thumbnail_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default Canva settings
  console.log('⚙️ Inserting default Canva settings...');
  db.exec(`
    INSERT OR IGNORE INTO canva_settings (
      id, 
      is_enabled, 
      platforms, 
      auto_generate_captions, 
      auto_generate_hashtags, 
      schedule_type,
      created_at,
      updated_at
    ) VALUES (
      1, 
      0, 
      '["instagram", "facebook", "telegram", "youtube"]', 
      1, 
      1, 
      'immediate',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `);

  // Verify tables were created
  console.log('Search Verifying tables...');
  
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE 'canva_%'
    ORDER BY name
  `).all();

  console.log('Success Canva tables found:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });

  // Check canva_settings content
  const settings = db.prepare('SELECT * FROM canva_settings WHERE id = 1').get();
  if (settings) {
    console.log('Success Default Canva settings created:');
    console.log(`   - Enabled: ${settings.is_enabled ? 'Yes' : 'No'}`);
    console.log(`   - Platforms: ${settings.platforms}`);
    console.log(`   - Auto Captions: ${settings.auto_generate_captions ? 'Yes' : 'No'}`);
    console.log(`   - Auto Hashtags: ${settings.auto_generate_hashtags ? 'Yes' : 'No'}`);
  }

  console.log('\nCelebration SUCCESS: All Canva automation tables created successfully!');
  console.log('Mobile You can now use the Automation Management panel in the admin area.');

} catch (error) {
  console.error('Error ERROR creating Canva tables:', error);
  process.exit(1);
} finally {
  db.close();
}
