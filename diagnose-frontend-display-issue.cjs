/**
 * Comprehensive Database Schema Analysis
 * Diagnose why products aren't displaying on frontend
 */

const Database = require('better-sqlite3');

console.log('🔍 COMPREHENSIVE DATABASE SCHEMA ANALYSIS');
console.log('='.repeat(70));
console.log('🎯 Goal: Find why products aren\'t displaying on frontend pages');
console.log('📊 Checking: Tables, schemas, field names, case sensitivity, data');
console.log('='.repeat(70));

try {
  const db = new Database('./database.sqlite');
  
  // Define expected tables for each bot/page
  const botTableMapping = {
    'prime-picks': 'amazon_products',
    'cue-picks': 'cuelinks_products', 
    'value-picks': 'value_picks_products',
    'travel-picks': 'travel_products',
    'click-picks': 'click_picks_products',
    'global-picks': 'global_picks_products',
    'deals-hub': 'deals_hub_products',
    'lootbox': 'lootbox_products'
  };
  
  // Check each table
  Object.entries(botTableMapping).forEach(([page, table]) => {
    console.log(`\n📊 PAGE: /${page} → TABLE: ${table}`);
    console.log('-'.repeat(50));
    
    try {
      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(table);
      
      if (!tableExists) {
        console.log('   ❌ TABLE DOES NOT EXIST!');
        console.log('   🔧 This is why products don\'t show on frontend');
        return;
      }
      
      console.log('   ✅ Table exists');
      
      // Get table schema
      const schema = db.prepare(`PRAGMA table_info(${table})`).all();
      console.log('   📋 Schema:');
      schema.forEach(col => {
        console.log(`      ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''}`);
      });
      
      // Count records
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`   📦 Records: ${count.count}`);
      
      if (count.count === 0) {
        console.log('   ⚠️  NO DATA - This is why products don\'t show!');
        console.log('   💡 Bot needs to post products to this table');
      } else {
        console.log('   ✅ Has data - checking sample...');
        
        // Get sample record
        const sample = db.prepare(`SELECT * FROM ${table} LIMIT 1`).get();
        console.log('   🎯 Sample fields:', Object.keys(sample).slice(0, 10).join(', '));
        
        // Check critical fields for frontend
        const criticalFields = ['id', 'name', 'price', 'image_url', 'affiliate_url'];
        const missingFields = criticalFields.filter(field => !(field in sample));
        
        if (missingFields.length > 0) {
          console.log('   ❌ MISSING CRITICAL FIELDS:', missingFields.join(', '));
          console.log('   🔧 Frontend expects these fields!');
        } else {
          console.log('   ✅ All critical fields present');
        }
        
        // Check for display_pages field (important for routing)
        if ('display_pages' in sample) {
          console.log(`   📄 display_pages: ${sample.display_pages}`);
        } else {
          console.log('   ⚠️  No display_pages field - might affect routing');
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  });
  
  // Check all tables in database
  console.log('\n\n🗄️  ALL TABLES IN DATABASE:');
  console.log('='.repeat(50));
  const allTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  allTables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   ${table.name}: ${count.count} records`);
  });
  
  db.close();
  
  console.log('\n\n🎯 DIAGNOSIS COMPLETE!');
  console.log('='.repeat(50));
  console.log('✅ Check above for missing tables, empty tables, or schema issues');
  console.log('💡 Common issues:');
  console.log('   - Table doesn\'t exist');
  console.log('   - Table exists but has no data');
  console.log('   - Wrong field names (case sensitivity)');
  console.log('   - Missing display_pages configuration');
  console.log('   - API routing issues');
  
} catch (error) {
  console.error('❌ Database analysis failed:', error.message);
}