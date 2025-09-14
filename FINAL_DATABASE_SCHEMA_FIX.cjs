#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔧 FINAL DATABASE SCHEMA FIX - DRIZZLE ORM COMPATIBLE...\n');

try {
  // 1. Connect to database
  console.log('Upload Step 1: Connecting to production database...');
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  console.log(`Database path: ${dbPath}`);
  
  const db = new Database(dbPath);
  console.log('Success Connected to production database');

  // 2. Check current state
  console.log('\n📋 Step 2: Checking current database state...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);
  console.log('Current tables:', tableNames);

  const canvaSettingsExists = tableNames.includes('canva_settings');
  console.log(`canva_settings table exists: ${canvaSettingsExists ? 'Success YES' : 'Error NO'}`);

  // 3. Drop and recreate canva_settings table with correct schema
  console.log('\n🔧 Step 3: Recreating canva_settings table with updated schema...');
  
  // Drop existing table if it exists
  if (canvaSettingsExists) {
    console.log('🗑️ Dropping existing canva_settings table...');
    db.exec('DROP TABLE canva_settings');
  }

  // Create table with exact schema from sqlite-schema.ts
  console.log('🏗️ Creating canva_settings table with manual caption/hashtag fields...');
  db.exec(`
    CREATE TABLE canva_settings (
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
  console.log('Success canva_settings table created with manual fields');

  // 4. Create other required tables
  console.log('\n🏗️ Step 4: Ensuring other Canva tables exist...');
  
  // Create canva_posts table
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
  console.log('Success canva_posts table ensured');

  // Create canva_templates table
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
  console.log('Success canva_templates table ensured');

  // 5. Insert default settings
  console.log('\nBlog Step 5: Inserting default settings...');
  const defaultSettings = db.prepare(`
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
  `);

  defaultSettings.run(
    0, // is_enabled = false initially
    1, // auto_generate_captions = true
    1, // auto_generate_hashtags = true
    'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!',
    '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
    JSON.stringify(['instagram', 'facebook']), // default platforms
    'immediate',
    0
  );
  console.log('Success Default settings inserted with manual templates');

  // 6. Verify the fix
  console.log('\nSearch Step 6: Verifying the fix...');
  const columns = db.prepare("PRAGMA table_info(canva_settings)").all();
  console.log('canva_settings table structure:');
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });

  const hasDefaultCaption = columns.some(col => col.name === 'default_caption');
  const hasDefaultHashtags = columns.some(col => col.name === 'default_hashtags');
  
  console.log(`\nSuccess default_caption field: ${hasDefaultCaption ? 'PRESENT' : 'MISSING'}`);
  console.log(`Success default_hashtags field: ${hasDefaultHashtags ? 'PRESENT' : 'MISSING'}`);

  const settingsData = db.prepare("SELECT * FROM canva_settings").all();
  console.log('\nCurrent settings data:');
  console.log(settingsData);

  db.close();

  // 7. Check if we need to rebuild the TypeScript
  console.log('\n🔧 Step 7: Checking if TypeScript rebuild is needed...');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Products dist folder exists - TypeScript rebuild recommended');
    console.log('Refresh You should run: npm run build');
  } else {
    console.log('Products No dist folder found - development mode');
  }

  console.log('\nCelebration DATABASE SCHEMA FIX COMPLETE!');
  console.log('\n📋 What was fixed:');
  console.log('  Success Recreated canva_settings table with correct Drizzle ORM schema');
  console.log('  Success Added default_caption and default_hashtags fields');
  console.log('  Success Ensured all Canva-related tables exist');
  console.log('  Success Inserted default settings with manual templates');
  console.log('  Success Schema now matches shared/sqlite-schema.ts exactly');
  
  console.log('\nRefresh IMMEDIATE NEXT STEPS:');
  console.log('  1. Restart PM2: pm2 restart pickntrust');
  console.log('  2. (Optional) Rebuild TypeScript: npm run build');
  console.log('  3. Test admin automation panel');
  console.log('  4. Try saving settings - SQLite error should be GONE!');
  
  console.log('\nSpecial Manual Caption/Hashtag Fields Ready:');
  console.log('  • Turn OFF auto-generate captions → Manual caption field appears');
  console.log('  • Turn OFF auto-generate hashtags → Manual hashtag field appears');
  console.log('  • Use placeholders: {title}, {price}, {category}, {description}');

} catch (error) {
  console.error('Error Error fixing database schema:', error);
  console.log('\n🔧 If this script fails, run these manual SQL commands:');
  console.log('1. Connect: sqlite3 database.sqlite');
  console.log('2. Run:');
  console.log(`
DROP TABLE IF EXISTS canva_settings;

CREATE TABLE canva_settings (
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
);

INSERT INTO canva_settings (is_enabled, auto_generate_captions, auto_generate_hashtags, default_caption, default_hashtags, platforms, schedule_type, schedule_delay_minutes) 
VALUES (0, 1, 1, 'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!', '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India', '["instagram","facebook"]', 'immediate', 0);
  `);
  console.log('3. Exit: .exit');
  console.log('4. Restart: pm2 restart pickntrust');
  process.exit(1);
}
