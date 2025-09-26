const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'database.db');
const db = new Database(dbPath);

console.log('🧹 Starting cleanup of unnecessary product tables...');

try {
  // List of tables to drop (these were created by mistake)
  const tablesToDrop = [
    'prime_picks_products',
    'cue_picks_products', 
    'amazon_products',
    'value_picks_products',
    'click_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'loot_box_products'
  ];

  let droppedCount = 0;
  
  for (const tableName of tablesToDrop) {
    try {
      // Check if table exists first
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(tableName);
      
      if (tableExists) {
        db.prepare(`DROP TABLE ${tableName}`).run();
        console.log(`✅ Dropped table: ${tableName}`);
        droppedCount++;
      } else {
        console.log(`ℹ️  Table ${tableName} doesn't exist, skipping`);
      }
    } catch (error) {
      console.log(`⚠️  Error dropping ${tableName}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Cleanup completed! Dropped ${droppedCount} unnecessary tables.`);
  console.log('✅ The bot will now use only the main "products" table with displayPages field.');
  
  // Verify remaining tables
  console.log('\n📋 Remaining product-related tables:');
  const remainingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE '%product%'
    ORDER BY name
  `).all();
  
  remainingTables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  
} catch (error) {
  console.error('❌ Error during cleanup:', error);
} finally {
  db.close();
}