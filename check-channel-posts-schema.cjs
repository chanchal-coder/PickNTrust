const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking channel_posts table schema...\n');

try {
  // Get table schema
  console.log('📋 channel_posts table schema:');
  const schema = db.prepare(`PRAGMA table_info(channel_posts)`).all();
  
  schema.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : ''} ${column.pk ? '(PRIMARY KEY)' : ''}`);
  });
  
  console.log('\n📊 Sample channel_posts entries:');
  const sampleEntries = db.prepare(`SELECT * FROM channel_posts LIMIT 5`).all();
  
  if (sampleEntries.length > 0) {
    sampleEntries.forEach((entry, index) => {
      console.log(`\n  Entry ${index + 1}:`);
      Object.entries(entry).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    });
  } else {
    console.log('  No entries found in channel_posts table');
  }
  
} catch (error) {
  console.error('❌ Error checking schema:', error.message);
} finally {
  db.close();
}