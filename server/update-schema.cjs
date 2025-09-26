const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== UPDATING UNIFIED_CONTENT TABLE SCHEMA ===');

// Add the missing pricing fields
const alterQueries = [
  'ALTER TABLE unified_content ADD COLUMN pricing_type TEXT DEFAULT "one-time"',
  'ALTER TABLE unified_content ADD COLUMN monthly_price TEXT DEFAULT NULL',
  'ALTER TABLE unified_content ADD COLUMN yearly_price TEXT DEFAULT NULL',
  'ALTER TABLE unified_content ADD COLUMN is_free INTEGER DEFAULT 0',
  'ALTER TABLE unified_content ADD COLUMN price_description TEXT DEFAULT NULL',
  'ALTER TABLE unified_content ADD COLUMN custom_pricing_details TEXT DEFAULT NULL'
];

let completed = 0;
const total = alterQueries.length;

alterQueries.forEach((query, index) => {
  db.run(query, (err) => {
    if (err) {
      // Check if column already exists
      if (err.message.includes('duplicate column name')) {
        console.log(`Column ${index + 1} already exists, skipping...`);
      } else {
        console.error(`Error adding column ${index + 1}:`, err.message);
      }
    } else {
      console.log(`✓ Added column ${index + 1}/${total}`);
    }
    
    completed++;
    if (completed === total) {
      console.log('\n=== SCHEMA UPDATE COMPLETE ===');
      
      // Verify the updated schema
      db.all("PRAGMA table_info(unified_content)", (err, rows) => {
        if (err) {
          console.error('Error checking schema:', err);
        } else {
          console.log('\nUpdated table columns:');
          rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
          });
        }
        db.close();
      });
    }
  });
});