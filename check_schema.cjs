const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.sqlite');
  
  console.log('=== CHECKING TABLES ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Available tables:', tables.map(t => t.name));
  
  if (tables.some(t => t.name === 'unified_content')) {
    console.log('\n=== UNIFIED_CONTENT SCHEMA ===');
    const schema = db.prepare('PRAGMA table_info(unified_content)').all();
    console.log('Columns:');
    schema.forEach(col => console.log(`  ${col.name} (${col.type})`));
    
    console.log('\n=== UNIFIED_CONTENT DATA ===');
    const count = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(`Total rows: ${count.count}`);
    
    if (count.count > 0) {
      const sample = db.prepare('SELECT * FROM unified_content LIMIT 3').all();
      console.log('Sample data:');
      sample.forEach((row, i) => {
        console.log(`Row ${i+1}:`, JSON.stringify(row, null, 2));
      });
    }
  } else {
    console.log('unified_content table does not exist');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}