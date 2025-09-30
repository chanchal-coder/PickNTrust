const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  // Get all tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('📊 DATABASE TABLES:');
  console.log('==================');
  
  tables.forEach((table, i) => {
    console.log(`${i+1}. ${table.name}`);
    
    // Get column info for each table
    try {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
      console.log(`   Columns (${columns.length}):`);
      columns.forEach(col => {
        const nullable = col.notnull ? 'NOT NULL' : 'NULL';
        const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
        console.log(`   - ${col.name} (${col.type}) ${nullable}${defaultVal}`);
      });
      
      // Get row count
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`   Records: ${count.count}`);
      console.log('');
    } catch (error) {
      console.log(`   Error reading table info: ${error.message}`);
      console.log('');
    }
  });
  
  console.log(`Total tables: ${tables.length}`);
  db.close();
  
} catch (error) {
  console.error('Error:', error.message);
}