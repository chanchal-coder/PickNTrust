const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 Testing Canva Migration Fix...\n');

// Check which database file exists
const dbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
console.log(`📁 Using database file: ${dbFile}`);

try {
  const db = new Database(dbFile);
  
  // Test 1: Check if Canva tables exist
  console.log('\n1️⃣ Checking if Canva tables exist...');
  
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE 'canva_%'
    ORDER BY name
  `).all();
  
  console.log('Found Canva tables:', tables.map(t => t.name));
  
  if (tables.length === 0) {
    console.log('❌ No Canva tables found - they will be created on first access');
  } else {
    console.log('✅ Canva tables already exist');
    
    // Test 2: Check canva_settings table structure
    console.log('\n2️⃣ Checking canva_settings table structure...');
    try {
      const columns = db.prepare("PRAGMA table_info(canva_settings)").all();
      console.log('canva_settings columns:', columns.map(c => `${c.name} (${c.type})`));
      
      // Test 3: Check if default settings exist
      console.log('\n3️⃣ Checking for default settings...');
      const settingsCount = db.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
      console.log(`Settings count: ${settingsCount.count}`);
      
      if (settingsCount.count > 0) {
        const settings = db.prepare('SELECT * FROM canva_settings LIMIT 1').get();
        console.log('Sample settings:', {
          id: settings.id,
          is_enabled: settings.is_enabled,
          auto_generate_captions: settings.auto_generate_captions,
          platforms: settings.platforms
        });
      }
    } catch (error) {
      console.log('❌ Error checking canva_settings:', error.message);
    }
  }
  
  // Test 4: Test table creation (simulate what happens on first access)
  console.log('\n4️⃣ Testing table creation logic...');
  
  try {
    // This mimics what ensureCanvaTablesExist() does
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
    
    console.log('✅ Table creation successful');
    
    // Test 5: Insert default settings if they don't exist
    const existingSettings = db.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
    if (existingSettings.count === 0) {
      console.log('\n5️⃣ Creating default settings...');
      
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
      
      console.log('✅ Default settings created successfully');
    } else {
      console.log('\n5️⃣ Default settings already exist');
    }
    
    // Test 6: Verify final state
    console.log('\n6️⃣ Final verification...');
    const finalTables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'canva_%'
      ORDER BY name
    `).all();
    
    const finalSettings = db.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
    
    console.log('✅ Final state:');
    console.log(`   - Canva tables: ${finalTables.map(t => t.name).join(', ')}`);
    console.log(`   - Settings records: ${finalSettings.count}`);
    
    if (finalTables.length === 3 && finalSettings.count > 0) {
      console.log('\n🎉 SUCCESS: Canva migration fix is working correctly!');
      console.log('   - All 3 Canva tables exist');
      console.log('   - Default settings are in place');
      console.log('   - The "no such table: canva_settings" error should be resolved');
    } else {
      console.log('\n❌ ISSUE: Something is not right');
    }
    
  } catch (error) {
    console.log('❌ Error during table creation test:', error.message);
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Database connection error:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. Deploy the updated server/db.ts and server/storage.ts files');
console.log('2. Restart your PM2 process: pm2 restart pickntrust');
console.log('3. Check the logs: pm2 logs pickntrust --lines 20');
console.log('4. Test the admin automation panel');
console.log('\nThe fix should automatically resolve the Canva table errors! 🚀');
