const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 Checking Widgets Table Status...');
console.log('=' .repeat(50));

try {
  // Check if widgets table exists
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='widgets'").get();
  
  if (tableInfo) {
    console.log('✅ Widgets table EXISTS');
    console.log('\n📋 Table Schema:');
    console.log(tableInfo.sql);
    
    // Check current widget count
    const count = db.prepare('SELECT COUNT(*) as count FROM widgets').get();
    console.log(`\n📊 Current widgets: ${count.count}`);
    
    // Check table structure
    const columns = db.prepare('PRAGMA table_info(widgets)').all();
    console.log('\n🏗️  Table Columns:');
    columns.forEach(col => {
      console.log(`  • ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
  } else {
    console.log('❌ Widgets table does NOT exist!');
    console.log('\n🛠️  Need to create widgets table...');
    
    // Create widgets table
    console.log('\n🔨 Creating widgets table...');
    db.exec(`
      CREATE TABLE widgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        target_page TEXT NOT NULL,
        position TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        max_width TEXT,
        custom_css TEXT,
        show_on_mobile INTEGER DEFAULT 1,
        show_on_desktop INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);
    
    console.log('✅ Widgets table created successfully!');
  }
  
} catch (error) {
  console.log('❌ Error checking widgets table:', error.message);
  console.log('\n🔍 Error details:', error);
}

db.close();
console.log('\n✅ Database check complete!');