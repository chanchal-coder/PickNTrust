const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== DATABASE SCHEMA ===\n');
  
  // Get table schema
  const schema = db.prepare("PRAGMA table_info(unified_content)").all();
  
  console.log('unified_content table columns:');
  schema.forEach(column => {
    const nullable = column.notnull === 0 ? 'NULL' : 'NOT NULL';
    const defaultVal = column.dflt_value ? ` DEFAULT ${column.dflt_value}` : '';
    console.log(`  ${column.name}: ${column.type} ${nullable}${defaultVal}`);
  });
  
  console.log('\n=== SAMPLE EXISTING RECORD ===\n');
  
  // Get a sample record to see the structure
  const sample = db.prepare("SELECT * FROM unified_content LIMIT 1").get();
  if (sample) {
    Object.keys(sample).forEach(key => {
      console.log(`${key}: ${sample[key]}`);
    });
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}