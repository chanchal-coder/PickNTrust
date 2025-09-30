const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('🔧 FIXING UNIFIED_CONTENT TABLE SCHEMA');
console.log('=====================================');

try {
  // Check if display_pages column exists
  const tableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  const hasDisplayPages = tableInfo.some(col => col.name === 'display_pages');
  
  if (!hasDisplayPages) {
    console.log('➕ Adding display_pages column...');
    db.exec(`ALTER TABLE unified_content ADD COLUMN display_pages TEXT DEFAULT '["home"]'`);
    console.log('✅ Added display_pages column');
  } else {
    console.log('✅ display_pages column already exists');
  }
  
  // Verify the schema
  console.log('\n📋 UPDATED SCHEMA:');
  const updatedInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  updatedInfo.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
  });
  
  console.log('\n✅ Schema update completed successfully!');
  
} catch (error) {
  console.error('❌ Error updating schema:', error.message);
} finally {
  db.close();
}