const Database = require('better-sqlite3');
const fs = require('fs');

try {
  console.log('🧹 CLEANING UP OLD REDUNDANT TABLES');
  console.log('==================================\n');

  const db = new Database('./database.db');
  console.log('✅ Connected to database\n');

  // List of tables to potentially remove (after verification)
  const tablesToCheck = [
    'products',
    'amazon_products', 
    'prime_picks_products',
    'cue_picks_products',
    'travel_deals',
    'hotel_deals',
    'flight_deals'
  ];

  // Check which tables exist
  const existingTables = [];
  for (const table of tablesToCheck) {
    try {
      const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
      if (result) {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        existingTables.push({ name: table, count: count.count });
        console.log(`📋 Table "${table}" exists with ${count.count} records`);
      }
    } catch (error) {
      console.log(`❌ Table "${table}" does not exist or error: ${error.message}`);
    }
  }

  if (existingTables.length === 0) {
    console.log('✅ No old tables found to clean up');
    db.close();
    return;
  }

  // Create backup of data before deletion
  console.log('\n💾 CREATING BACKUP OF OLD TABLES');
  console.log('================================');
  
  const backupData = {};
  for (const table of existingTables) {
    if (table.count > 0) {
      try {
        const data = db.prepare(`SELECT * FROM ${table.name}`).all();
        backupData[table.name] = data;
        console.log(`✅ Backed up ${data.length} records from ${table.name}`);
      } catch (error) {
        console.log(`❌ Error backing up ${table.name}: ${error.message}`);
      }
    }
  }

  // Save backup to file
  if (Object.keys(backupData).length > 0) {
    fs.writeFileSync('./old-tables-backup.json', JSON.stringify(backupData, null, 2));
    console.log('✅ Backup saved to old-tables-backup.json');
  }

  // Now drop the old tables (only if they have data backed up or are empty)
  console.log('\n🗑️  DROPPING OLD TABLES');
  console.log('======================');
  
  for (const table of existingTables) {
    try {
      // Only drop if we have backup or table is empty
      if (table.count === 0 || backupData[table.name]) {
        db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
        console.log(`✅ Dropped table: ${table.name}`);
      } else {
        console.log(`⚠️  Skipped ${table.name} - no backup created`);
      }
    } catch (error) {
      console.log(`❌ Error dropping ${table.name}: ${error.message}`);
    }
  }

  // Verify cleanup
  console.log('\n🔍 VERIFYING CLEANUP');
  console.log('===================');
  
  for (const table of tablesToCheck) {
    try {
      const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
      if (result) {
        console.log(`⚠️  Table "${table}" still exists`);
      } else {
        console.log(`✅ Table "${table}" successfully removed`);
      }
    } catch (error) {
      console.log(`✅ Table "${table}" confirmed removed`);
    }
  }

  // Show remaining tables
  console.log('\n📊 REMAINING TABLES');
  console.log('==================');
  const remainingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  remainingTables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`- ${table.name}: ${count.count} records`);
  });

  db.close();
  console.log('\n✅ Cleanup completed successfully!');

} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}