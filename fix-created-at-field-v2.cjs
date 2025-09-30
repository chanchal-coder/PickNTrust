#!/usr/bin/env node
// Fix Missing created_at Field in Product Tables (Version 2)

const Database = require('better-sqlite3');

console.log('🔧 Adding Missing created_at Field...');

const db = new Database('database.sqlite');

try {
  const productTables = [
    'amazon_products',
    'cuelinks_products', 
    'value_picks_products',
    'click_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'lootbox_products',
    'travel_products'
  ];

  console.log('📋 Adding created_at field to product tables...');

  for (const tableName of productTables) {
    console.log(`\n🔧 Processing ${tableName}...`);
    
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name=?
    `).get(tableName);
    
    if (!tableExists) {
      console.log(`❌ Table ${tableName} does not exist, skipping...`);
      continue;
    }

    // Get current columns
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columnNames = columns.map(col => col.name);
    
    // Add created_at field if missing
    if (!columnNames.includes('created_at')) {
      try {
        console.log(`  ➕ Adding created_at...`);
        // Add column without default value first
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN created_at INTEGER`);
        
        // Then update all records with current timestamp
        const currentTimestamp = Math.floor(Date.now() / 1000);
        db.exec(`UPDATE ${tableName} SET created_at = ${currentTimestamp}`);
        
        console.log(`  ✅ created_at added and populated`);
        
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`  ✅ created_at already exists`);
        } else {
          console.error(`  ❌ Error adding created_at:`, error.message);
          continue;
        }
      }
    } else {
      console.log(`  ✅ created_at already exists`);
      
      // Update null values
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const nullCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE created_at IS NULL`).get().count;
      if (nullCount > 0) {
        db.exec(`UPDATE ${tableName} SET created_at = ${currentTimestamp} WHERE created_at IS NULL`);
        console.log(`  🔄 Updated ${nullCount} null created_at values`);
      }
    }

    // Sync with createdAt if it exists
    if (columnNames.includes('createdAt')) {
      console.log(`  🔄 Syncing createdAt <-> created_at...`);
      // Copy from createdAt to created_at if created_at is null
      db.exec(`UPDATE ${tableName} SET created_at = createdAt WHERE created_at IS NULL AND createdAt IS NOT NULL`);
      // Copy from created_at to createdAt if createdAt is null
      db.exec(`UPDATE ${tableName} SET createdAt = created_at WHERE createdAt IS NULL AND created_at IS NOT NULL`);
    }

    // Show final status
    const finalColumns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const recordCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
    console.log(`  ✅ Final columns: ${finalColumns.length}, Records: ${recordCount}`);
    
    // Verify created_at has values
    const nullCreatedAt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE created_at IS NULL`).get().count;
    console.log(`  📅 Records with created_at: ${recordCount - nullCreatedAt}/${recordCount}`);
  }

  console.log('\n🎉 created_at field has been added to all tables!');
  console.log('\n📊 Final Summary:');
  
  for (const tableName of productTables) {
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name=?
    `).get(tableName);
    
    if (tableExists) {
      const recordCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const hasCreatedAt = columns.some(col => col.name === 'created_at');
      const nullCreatedAt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE created_at IS NULL`).get().count;
      console.log(`✅ ${tableName}: ${recordCount} records, ${columns.length} columns, created_at: ${hasCreatedAt ? '✅' : '❌'} (${recordCount - nullCreatedAt}/${recordCount} populated)`);
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}