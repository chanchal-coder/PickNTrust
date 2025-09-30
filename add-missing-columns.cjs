const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('=== ADDING MISSING COLUMNS FOR SMART CATEGORIZATION ===\n');

try {
  // Check current columns
  const columns = db.prepare("PRAGMA table_info(unified_content)").all();
  const columnNames = columns.map(col => col.name);
  
  console.log('Current columns:', columnNames.join(', '));
  
  // Add missing columns if they don't exist
  const columnsToAdd = [
    { name: 'is_service', type: 'INTEGER', default: '0' },
    { name: 'is_ai_app', type: 'INTEGER', default: '0' },
    { name: 'processing_status', type: 'TEXT', default: "'completed'" },
    { name: 'visibility', type: 'TEXT', default: "'public'" },
    { name: 'source_platform', type: 'TEXT', default: "'admin'" },
    { name: 'content', type: 'TEXT', default: 'NULL' },
    { name: 'affiliate_urls', type: 'TEXT', default: 'NULL' },
    { name: 'media_urls', type: 'TEXT', default: 'NULL' },
    { name: 'timer_end_time', type: 'INTEGER', default: 'NULL' },
    { name: 'channel_id', type: 'TEXT', default: 'NULL' },
    { name: 'channel_name', type: 'TEXT', default: 'NULL' },
    { name: 'page_slug', type: 'TEXT', default: 'NULL' },
    { name: 'author_id', type: 'TEXT', default: 'NULL' },
    { name: 'author_name', type: 'TEXT', default: 'NULL' },
    { name: 'views', type: 'INTEGER', default: 'NULL' },
    { name: 'shares', type: 'INTEGER', default: 'NULL' },
    { name: 'likes', type: 'INTEGER', default: 'NULL' },
    { name: 'comments', type: 'INTEGER', default: 'NULL' },
    { name: 'clicks', type: 'INTEGER', default: 'NULL' },
    { name: 'conversions', type: 'INTEGER', default: 'NULL' },
    { name: 'last_fetched_at', type: 'INTEGER', default: 'NULL' },
    { name: 'metadata', type: 'TEXT', default: 'NULL' },
    { name: 'priority', type: 'INTEGER', default: '0' },
    { name: 'language', type: 'TEXT', default: "'en'" },
    { name: 'country', type: 'TEXT', default: "'IN'" },
    { name: 'tags', type: 'TEXT', default: 'NULL' }
  ];

  let addedColumns = 0;
  
  for (const column of columnsToAdd) {
    if (!columnNames.includes(column.name)) {
      try {
        const sql = `ALTER TABLE unified_content ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`;
        console.log(`Adding column: ${column.name}`);
        db.exec(sql);
        addedColumns++;
      } catch (error) {
        console.error(`Error adding column ${column.name}:`, error.message);
      }
    } else {
      console.log(`Column ${column.name} already exists`);
    }
  }

  console.log(`\n✅ Added ${addedColumns} new columns to unified_content table`);

  // Verify the new structure
  const newColumns = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log(`\n📋 Updated table now has ${newColumns.length} columns`);

  // Check if we have the key columns for smart categorization
  const hasService = newColumns.some(col => col.name === 'is_service');
  const hasAiApp = newColumns.some(col => col.name === 'is_ai_app');
  
  console.log(`\n🎯 Smart categorization columns:`);
  console.log(`  is_service: ${hasService ? '✅' : '❌'}`);
  console.log(`  is_ai_app: ${hasAiApp ? '✅' : '❌'}`);

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}