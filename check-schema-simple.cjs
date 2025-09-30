const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database schema...\n');

// Check unified_content table schema
db.all("PRAGMA table_info(unified_content)", (err, rows) => {
  if (err) {
    console.error('❌ Error checking unified_content schema:', err);
  } else {
    console.log('📋 unified_content table schema:');
    rows.forEach(row => {
      console.log(`   ${row.name}: ${row.type} ${row.notnull ? '(NOT NULL)' : ''} ${row.pk ? '(PRIMARY KEY)' : ''}`);
    });
  }
  
  // Check channel_posts table schema
  db.all("PRAGMA table_info(channel_posts)", (err, rows) => {
    if (err) {
      console.error('❌ Error checking channel_posts schema:', err);
    } else {
      console.log('\n📋 channel_posts table schema:');
      rows.forEach(row => {
        console.log(`   ${row.name}: ${row.type} ${row.notnull ? '(NOT NULL)' : ''} ${row.pk ? '(PRIMARY KEY)' : ''}`);
      });
    }
    
    // Check sample data
    db.all("SELECT COUNT(*) as count FROM unified_content", (err, rows) => {
      if (err) {
        console.error('❌ Error counting unified_content:', err);
      } else {
        console.log(`\n📊 unified_content records: ${rows[0].count}`);
      }
      
      db.all("SELECT COUNT(*) as count FROM channel_posts", (err, rows) => {
        if (err) {
          console.error('❌ Error counting channel_posts:', err);
        } else {
          console.log(`📊 channel_posts records: ${rows[0].count}`);
        }
        
        db.close();
      });
    });
  });
});