const Database = require('better-sqlite3');
const path = require('path');

console.log('Checking all database tables...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  
  console.log('\n📋 Current database tables:');
  tables.forEach(table => {
    console.log(`  ✅ ${table.name}`);
  });
  
  // Check for required tables based on the schema
  const requiredTables = [
    'products',
    'blog_posts', 
    'newsletter_subscribers',
    'categories',
    'affiliate_networks',
    'admin_users',
    'announcements',
    'video_content'
  ];
  
  console.log('\n🔍 Checking required tables:');
  const existingTableNames = tables.map(t => t.name);
  
  requiredTables.forEach(tableName => {
    if (existingTableNames.includes(tableName)) {
      console.log(`  ✅ ${tableName} - EXISTS`);
    } else {
      console.log(`  ❌ ${tableName} - MISSING`);
    }
  });
  
  // Show table structures for debugging
  console.log('\n📊 Table structures:');
  existingTableNames.forEach(tableName => {
    if (requiredTables.includes(tableName)) {
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      console.log(`\n${tableName}:`);
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });
    }
  });
  
} catch (error) {
  console.error('❌ Error checking tables:', error.message);
} finally {
  db.close();
  console.log('\nDatabase connection closed');
}
