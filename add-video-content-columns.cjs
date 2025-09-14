const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Adding missing columns to video_content table...');

// Use the correct database file
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Check if table exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='video_content'").get();
  
  if (!tableExists) {
    console.log('Error video_content table does not exist!');
    process.exit(1);
  }
  
  console.log('Success video_content table found');
  
  // Get current table structure
  const columns = db.prepare("PRAGMA table_info(video_content)").all();
  const existingColumns = columns.map(col => col.name);
  
  console.log('📋 Current columns:', existingColumns.join(', '));
  
  // Define missing columns to add
  const columnsToAdd = [
    { name: 'pages', sql: 'pages TEXT DEFAULT \'[]\'' },
    { name: 'show_on_homepage', sql: 'show_on_homepage INTEGER DEFAULT 1' },
    { name: 'cta_text', sql: 'cta_text TEXT' },
    { name: 'cta_url', sql: 'cta_url TEXT' }
  ];
  
  // Add missing columns
  let addedColumns = 0;
  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      try {
        const sql = `ALTER TABLE video_content ADD COLUMN ${column.sql}`;
        db.prepare(sql).run();
        console.log(`Success Added column: ${column.name}`);
        addedColumns++;
      } catch (error) {
        console.log(`Error Failed to add ${column.name}: ${error.message}`);
      }
    } else {
      console.log(`Success Column ${column.name} already exists`);
    }
  }
  
  // Verify the final structure
  const finalColumns = db.prepare("PRAGMA table_info(video_content)").all();
  console.log('\n📋 Final table structure:');
  finalColumns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  console.log(`\nCelebration Migration completed! Added ${addedColumns} new columns.`);
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}