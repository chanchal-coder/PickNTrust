#!/usr/bin/env node
// Fix Field Naming Inconsistencies in Product Tables
// Add snake_case versions of camelCase fields

const Database = require('better-sqlite3');

console.log('🔧 Fixing Field Naming Inconsistencies...');

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

  console.log('📋 Adding snake_case field aliases...');

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
    
    console.log(`📋 Current columns: ${columnNames.length} total`);

    // Add missing snake_case fields
    const fieldsToAdd = [
      { name: 'review_count', type: 'INTEGER DEFAULT 0' },
      { name: 'is_new', type: 'INTEGER DEFAULT 0' },
      { name: 'is_featured', type: 'INTEGER DEFAULT 0' }
    ];

    for (const field of fieldsToAdd) {
      if (!columnNames.includes(field.name)) {
        try {
          console.log(`  ➕ Adding ${field.name}...`);
          db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${field.name} ${field.type}`);
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            console.log(`  ✅ ${field.name} already exists`);
          } else {
            console.error(`  ❌ Error adding ${field.name}:`, error.message);
          }
        }
      } else {
        console.log(`  ✅ ${field.name} already exists`);
      }
    }

    // Sync data between camelCase and snake_case fields
    console.log(`  🔄 Syncing field data...`);
    
    try {
      // Sync reviewCount <-> review_count
      if (columnNames.includes('reviewCount')) {
        db.exec(`UPDATE ${tableName} SET review_count = reviewCount WHERE review_count IS NULL OR review_count = 0`);
      }
      if (columnNames.includes('review_count')) {
        db.exec(`UPDATE ${tableName} SET reviewCount = review_count WHERE reviewCount IS NULL OR reviewCount = 0`);
      }

      // Sync isNew <-> is_new
      if (columnNames.includes('isNew')) {
        db.exec(`UPDATE ${tableName} SET is_new = isNew WHERE is_new IS NULL`);
      }
      if (columnNames.includes('is_new')) {
        db.exec(`UPDATE ${tableName} SET isNew = is_new WHERE isNew IS NULL`);
      }

      // Sync isFeatured <-> is_featured
      if (columnNames.includes('isFeatured')) {
        db.exec(`UPDATE ${tableName} SET is_featured = isFeatured WHERE is_featured IS NULL`);
      }
      if (columnNames.includes('is_featured')) {
        db.exec(`UPDATE ${tableName} SET isFeatured = is_featured WHERE isFeatured IS NULL`);
      }

    } catch (error) {
      console.error(`  ⚠️ Warning during sync:`, error.message);
    }

    // Show final column count
    const finalColumns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    console.log(`  ✅ Final columns (${finalColumns.length}): Added snake_case fields`);
    
    // Show record count
    const recordCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
    console.log(`  📦 Records: ${recordCount}`);
  }

  console.log('\n🎉 Field naming inconsistencies have been fixed!');
  console.log('\n📊 Summary:');
  
  for (const tableName of productTables) {
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name=?
    `).get(tableName);
    
    if (tableExists) {
      const recordCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      console.log(`✅ ${tableName}: ${recordCount} records, ${columns.length} columns`);
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}