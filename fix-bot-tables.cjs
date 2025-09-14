// Fix Bot Product Tables - Add Missing created_at Column
// This script fixes the specific issue preventing webhook messages from creating products

const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 FIXING BOT PRODUCT TABLES');
console.log('=' .repeat(50));

// Database path
const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log(`📁 Database: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  // List of bot product tables that need the created_at column
  const botTables = [
    'prime_picks_products',
    'cue_picks_products',
    'value_picks_products',
    'click_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'loot_box_products',
    'dealshub_products'
  ];
  
  console.log('\n🔍 Checking and fixing bot product tables...');
  
  for (const tableName of botTables) {
    try {
      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(tableName);
      
      if (!tableExists) {
        console.log(`⚠️  Table ${tableName} does not exist - skipping`);
        continue;
      }
      
      // Check if created_at column exists
      const columns = db.pragma(`table_info(${tableName})`);
      const hasCreatedAt = columns.some(col => col.name === 'created_at');
      
      if (hasCreatedAt) {
        console.log(`✅ ${tableName}: created_at column already exists`);
      } else {
        // Add created_at column
        console.log(`🔧 ${tableName}: Adding created_at column...`);
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN created_at INTEGER DEFAULT (strftime('%s', 'now'))`);
        console.log(`✅ ${tableName}: created_at column added successfully`);
      }
      
      // Also check for other commonly missing columns
      const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
      if (!hasUpdatedAt) {
        console.log(`🔧 ${tableName}: Adding updated_at column...`);
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN updated_at INTEGER DEFAULT (strftime('%s', 'now'))`);
        console.log(`✅ ${tableName}: updated_at column added`);
      }
      
    } catch (error) {
      console.error(`❌ Error fixing ${tableName}:`, error.message);
    }
  }
  
  console.log('\n📊 VERIFICATION:');
  console.log('Checking all bot tables after fixes...');
  
  for (const tableName of botTables) {
    try {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(tableName);
      
      if (tableExists) {
        const columns = db.pragma(`table_info(${tableName})`);
        const hasCreatedAt = columns.some(col => col.name === 'created_at');
        const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
        
        console.log(`📋 ${tableName}:`);
        console.log(`   - created_at: ${hasCreatedAt ? '✅' : '❌'}`);
        console.log(`   - updated_at: ${hasUpdatedAt ? '✅' : '❌'}`);
        console.log(`   - Total columns: ${columns.length}`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}: Error checking - ${error.message}`);
    }
  }
  
  db.close();
  
  console.log('\n🎉 BOT TABLE FIXES COMPLETED!');
  console.log('\n🧪 NEXT STEPS:');
  console.log('1. Test webhook by posting a URL in Telegram channel');
  console.log('2. Run: node check-all-products.cjs');
  console.log('3. Check if products are now being created');
  
} catch (error) {
  console.error('❌ Database connection error:', error.message);
  process.exit(1);
}