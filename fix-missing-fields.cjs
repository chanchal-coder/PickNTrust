#!/usr/bin/env node
// Fix Missing Critical Fields in Product Tables
// Add currency, image_url, affiliate_url fields to all product tables

const Database = require('better-sqlite3');

console.log('🔧 Adding Missing Critical Fields to Product Tables...');

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

  console.log('📋 Adding missing fields to product tables...');

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
    
    console.log(`📋 Current columns: ${columnNames.join(', ')}`);

    // Add missing fields
    const fieldsToAdd = [
      { name: 'currency', type: 'TEXT DEFAULT "USD"' },
      { name: 'image_url', type: 'TEXT' },
      { name: 'affiliate_url', type: 'TEXT' }
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

    // Update existing records with default values if they're null
    console.log(`  🔄 Updating null values...`);
    
    // Update currency to USD if null
    db.exec(`UPDATE ${tableName} SET currency = 'USD' WHERE currency IS NULL`);
    
    // Update image_url with placeholder if null
    db.exec(`UPDATE ${tableName} SET image_url = 'https://via.placeholder.com/300x300' WHERE image_url IS NULL OR image_url = ''`);
    
    // Update affiliate_url with example if null
    db.exec(`UPDATE ${tableName} SET affiliate_url = 'https://example.com/product' WHERE affiliate_url IS NULL OR affiliate_url = ''`);

    // Show final column count
    const finalColumns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    console.log(`  ✅ Final columns (${finalColumns.length}): ${finalColumns.map(col => col.name).join(', ')}`);
    
    // Show record count
    const recordCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
    console.log(`  📦 Records: ${recordCount}`);
  }

  console.log('\n🎉 All missing fields have been added successfully!');
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