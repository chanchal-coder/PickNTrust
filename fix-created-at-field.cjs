#!/usr/bin/env node
// Fix Missing created_at Field in Product Tables

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
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN created_at INTEGER DEFAULT (strftime('%s', 'now'))`);
        
        // Update existing records with current timestamp
        db.exec(`UPDATE ${tableName} SET created_at = strftime('%s', 'now') WHERE created_at IS NULL`);
        
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`  ✅ created_at already exists`);
        } else {
          console.error(`  ❌ Error adding created_at:`, error.message);
        }
      }
    } else {
      console.log(`  ✅ created_at already exists`);
      
      // Update null values
      db.exec(`UPDATE ${tableName} SET created_at = strftime('%s', 'now') WHERE created_at IS NULL`);
    }

    // Sync with createdAt if it exists
    if (columnNames.includes('createdAt')) {
      console.log(`  🔄 Syncing createdAt <-> created_at...`);
      db.exec(`UPDATE ${tableName} SET created_at = createdAt WHERE created_at IS NULL AND createdAt IS NOT NULL`);
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
      console.log(`✅ ${tableName}: ${recordCount} records, ${columns.length} columns, created_at: ${hasCreatedAt ? '✅' : '❌'}`);
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}