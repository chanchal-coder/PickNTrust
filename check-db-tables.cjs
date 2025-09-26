const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Checking database tables...');

const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Get all table names
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  console.log('\nTables in database:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // Check if unified_content exists
  const unifiedContentExists = tables.some(table => table.name === 'unified_content');
  console.log(`\nDoes unified_content table exist? ${unifiedContentExists}`);
  
  if (unifiedContentExists) {
    // Get schema for unified_content
    const schema = db.prepare("PRAGMA table_info(unified_content)").all();
    console.log('\nSchema for unified_content:');
    schema.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });
    
    // Count rows
    const count = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    console.log(`\nRows in unified_content: ${count.count}`);
  }
  
  db.close();
  console.log('\n✅ Database check completed');
  
} catch (error) {
  console.error('❌ Error checking database:', error.message);
}