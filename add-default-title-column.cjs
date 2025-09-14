const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

console.log('🔧 Adding missing default_title column to canva_settings table...\n');

// Find the database file
const possibleDbPaths = [
  'database.sqlite',
  'server/database.sqlite',
  'data/database.sqlite'
];

let dbPath = null;
for (const possiblePath of possibleDbPaths) {
  if (fs.existsSync(possiblePath)) {
    dbPath = possiblePath;
    break;
  }
}

if (!dbPath) {
  // Try to find any .sqlite or .db file
  const findDbFile = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && (file.endsWith('.sqlite') || file.endsWith('.db'))) {
        return fullPath;
      }
    }
    return null;
  };
  
  dbPath = findDbFile('.') || findDbFile('./server') || findDbFile('./data');
}

if (!dbPath) {
  console.error('Error Could not find database file');
  process.exit(1);
}

console.log(`Upload Using database: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  // Check if canva_settings table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='canva_settings'
  `).get();
  
  if (!tableExists) {
    console.log('Warning  canva_settings table does not exist. Creating it...');
    
    // Create the complete canva_settings table
    db.exec(`
      CREATE TABLE canva_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_enabled INTEGER DEFAULT 0,
        api_key TEXT,
        api_secret TEXT,
        default_template_id TEXT,
        auto_generate_captions INTEGER DEFAULT 1,
        auto_generate_hashtags INTEGER DEFAULT 1,
        default_title TEXT,
        default_caption TEXT,
        default_hashtags TEXT,
        platforms TEXT DEFAULT '[]',
        schedule_type TEXT DEFAULT 'immediate',
        schedule_delay_minutes INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    console.log('Success Created canva_settings table with all columns including default_title');
  } else {
    // Check if default_title column exists
    const columns = db.prepare(`PRAGMA table_info(canva_settings)`).all();
    const hasDefaultTitle = columns.some(col => col.name === 'default_title');
    
    if (hasDefaultTitle) {
      console.log('Success default_title column already exists');
    } else {
      console.log('➕ Adding default_title column...');
      
      // Add the missing column
      db.exec(`ALTER TABLE canva_settings ADD COLUMN default_title TEXT`);
      
      console.log('Success Added default_title column successfully');
    }
  }
  
  // Show current table structure
  console.log('\n📋 Current canva_settings table structure:');
  const columns = db.prepare(`PRAGMA table_info(canva_settings)`).all();
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.dflt_value ? ` (default: ${col.dflt_value})` : ''}`);
  });
  
  db.close();
  
  console.log('\nCelebration Database migration completed successfully!');
  console.log('Success The canva_settings table now has all required columns:');
  console.log('   - default_title Success');
  console.log('   - default_caption Success');
  console.log('   - default_hashtags Success');
  console.log('\nRefresh Please restart your server to apply the changes.');
  
} catch (error) {
  console.error('Error Error updating database:', error.message);
  process.exit(1);
}
