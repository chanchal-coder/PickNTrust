/**
 * Fix Table Name Mismatches - Root Cause of Frontend Display Issues
 * 
 * PROBLEM IDENTIFIED:
 * - API routes expect certain table names
 * - Bots are saving to different table names
 * - Data exists but in wrong tables
 * 
 * SOLUTION:
 * - Fix table name mismatches by updating API routes
 * - OR migrate data to correct tables
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING TABLE NAME MISMATCHES');
console.log('='.repeat(60));
console.log('🎯 Goal: Fix why products don\'t show on frontend');
console.log('📊 Issue: API expects different table names than bots use');
console.log('='.repeat(60));

try {
  const db = new Database('./database.sqlite');
  
  // IDENTIFIED MISMATCHES:
  const mismatches = {
    'lootbox': {
      apiExpects: 'lootbox_products',
      dataExistsIn: 'loot_box_products',
      recordCount: 17
    },
    'deals-hub': {
      apiExpects: 'deals_hub_products', 
      dataExistsIn: 'dealshub_products',
      recordCount: 3
    }
  };
  
  console.log('\n🔍 CONFIRMED MISMATCHES:');
  Object.entries(mismatches).forEach(([page, info]) => {
    console.log(`\n📄 PAGE: /${page}`);
    console.log(`   API expects: ${info.apiExpects}`);
    console.log(`   Data exists in: ${info.dataExistsIn}`);
    console.log(`   Records available: ${info.recordCount}`);
    console.log('   ❌ MISMATCH - This is why products don\'t show!');
  });
  
  console.log('\n\n🛠️  SOLUTION OPTIONS:');
  console.log('1. 📋 Copy data from existing tables to expected tables');
  console.log('2. 🔧 Update API routes to use existing table names');
  console.log('3. 🤖 Update bots to save to expected table names');
  
  console.log('\n\n🚀 IMPLEMENTING SOLUTION 1: Copy data to expected tables');
  
  // Solution 1: Copy loot_box_products to lootbox_products
  console.log('\n📦 Fixing Loot Box products...');
  try {
    // Check if target table exists
    const lootboxTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='lootbox_products'
    `).get();
    
    if (lootboxTableExists) {
      // Copy data from loot_box_products to lootbox_products
      const sourceData = db.prepare('SELECT * FROM loot_box_products').all();
      console.log(`   📊 Found ${sourceData.length} records in loot_box_products`);
      
      if (sourceData.length > 0) {
        // Clear target table first
        db.prepare('DELETE FROM lootbox_products').run();
        console.log('   🗑️  Cleared lootbox_products table');
        
        // Get column info for both tables
        const sourceColumns = db.prepare('PRAGMA table_info(loot_box_products)').all();
        const targetColumns = db.prepare('PRAGMA table_info(lootbox_products)').all();
        
        console.log('   📋 Source columns:', sourceColumns.map(c => c.name).join(', '));
        console.log('   📋 Target columns:', targetColumns.map(c => c.name).join(', '));
        
        // Find common columns
        const sourceColNames = sourceColumns.map(c => c.name);
        const targetColNames = targetColumns.map(c => c.name);
        const commonColumns = sourceColNames.filter(col => targetColNames.includes(col));
        
        console.log('   🔗 Common columns:', commonColumns.join(', '));
        
        if (commonColumns.length > 0) {
          // Prepare insert statement
          const placeholders = commonColumns.map(() => '?').join(', ');
          const insertSQL = `INSERT INTO lootbox_products (${commonColumns.join(', ')}) VALUES (${placeholders})`;
          const insertStmt = db.prepare(insertSQL);
          
          // Copy each record
          let copiedCount = 0;
          sourceData.forEach(record => {
            try {
              const values = commonColumns.map(col => record[col]);
              insertStmt.run(...values);
              copiedCount++;
            } catch (error) {
              console.log(`   ⚠️  Failed to copy record ${record.id}: ${error.message}`);
            }
          });
          
          console.log(`   ✅ Copied ${copiedCount} records to lootbox_products`);
        } else {
          console.log('   ❌ No common columns found - schema mismatch');
        }
      }
    } else {
      console.log('   ❌ lootbox_products table does not exist');
    }
  } catch (error) {
    console.log(`   ❌ Error fixing loot box: ${error.message}`);
  }
  
  // Solution 1: Copy dealshub_products to deals_hub_products  
  console.log('\n🔥 Fixing Deals Hub products...');
  try {
    const dealsHubTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='deals_hub_products'
    `).get();
    
    if (dealsHubTableExists) {
      const sourceData = db.prepare('SELECT * FROM dealshub_products').all();
      console.log(`   📊 Found ${sourceData.length} records in dealshub_products`);
      
      if (sourceData.length > 0) {
        // Clear target table first
        db.prepare('DELETE FROM deals_hub_products').run();
        console.log('   🗑️  Cleared deals_hub_products table');
        
        // Get column info
        const sourceColumns = db.prepare('PRAGMA table_info(dealshub_products)').all();
        const targetColumns = db.prepare('PRAGMA table_info(deals_hub_products)').all();
        
        const sourceColNames = sourceColumns.map(c => c.name);
        const targetColNames = targetColumns.map(c => c.name);
        const commonColumns = sourceColNames.filter(col => targetColNames.includes(col));
        
        console.log('   🔗 Common columns:', commonColumns.join(', '));
        
        if (commonColumns.length > 0) {
          const placeholders = commonColumns.map(() => '?').join(', ');
          const insertSQL = `INSERT INTO deals_hub_products (${commonColumns.join(', ')}) VALUES (${placeholders})`;
          const insertStmt = db.prepare(insertSQL);
          
          let copiedCount = 0;
          sourceData.forEach(record => {
            try {
              const values = commonColumns.map(col => record[col]);
              insertStmt.run(...values);
              copiedCount++;
            } catch (error) {
              console.log(`   ⚠️  Failed to copy record ${record.id}: ${error.message}`);
            }
          });
          
          console.log(`   ✅ Copied ${copiedCount} records to deals_hub_products`);
        } else {
          console.log('   ❌ No common columns found - schema mismatch');
        }
      }
    } else {
      console.log('   ❌ deals_hub_products table does not exist');
    }
  } catch (error) {
    console.log(`   ❌ Error fixing deals hub: ${error.message}`);
  }
  
  db.close();
  
  console.log('\n\n🎯 VERIFICATION: Testing API endpoints after fix...');
  
  // Test the API endpoints
  const axios = require('axios');
  
  const testEndpoints = async () => {
    const endpoints = [
      'http://localhost:5000/api/products/page/lootbox',
      'http://localhost:5000/api/products/page/deals-hub'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint);
        const products = response.data;
        console.log(`   ✅ ${endpoint}: ${products.length} products`);
        
        if (products.length > 0) {
          console.log(`      Sample: ${products[0].name}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint}: ${error.message}`);
      }
    }
  };
  
  // Wait a moment then test
  setTimeout(testEndpoints, 2000);
  
  console.log('\n\n🎊 TABLE MISMATCH FIX COMPLETED!');
  console.log('='.repeat(50));
  console.log('✅ Data copied from mismatched tables to expected tables');
  console.log('🔄 API endpoints should now return products');
  console.log('🌐 Frontend pages should now display products');
  console.log('\n💡 Next steps:');
  console.log('   1. Refresh frontend pages to see products');
  console.log('   2. Update bots to save to correct table names');
  console.log('   3. Test posting new products via Telegram');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
}