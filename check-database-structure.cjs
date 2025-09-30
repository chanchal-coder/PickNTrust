const Database = require('better-sqlite3');

console.log('🔍 CHECKING DATABASE STRUCTURE');
console.log('==============================\n');

try {
  const db = new Database('database.sqlite');
  
  // Check all tables
  console.log('📊 ALL TABLES:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  
  // Check if unified_content table exists and its structure
  console.log('\n📋 UNIFIED_CONTENT TABLE STRUCTURE:');
  try {
    const columns = db.prepare("PRAGMA table_info(unified_content)").all();
    if (columns.length > 0) {
      console.log('✅ unified_content table exists');
      columns.forEach(col => {
        console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
      });
      
      // Check data in unified_content
      const count = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
      console.log(`   Total records: ${count.count}`);
      
      // Check prime-picks specific data
      const primePicksCount = db.prepare(`
        SELECT COUNT(*) as count FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%' 
        AND processing_status = 'active'
      `).get();
      console.log(`   Prime Picks records: ${primePicksCount.count}`);
      
    } else {
      console.log('❌ unified_content table is empty or has no columns');
    }
  } catch (error) {
    console.log('❌ unified_content table does not exist');
    console.log(`   Error: ${error.message}`);
  }
  
  // Check if products table exists
  console.log('\n📋 PRODUCTS TABLE:');
  try {
    const productsCount = db.prepare("SELECT COUNT(*) as count FROM products").get();
    console.log(`✅ products table exists with ${productsCount.count} records`);
    
    // Check prime-picks in products table
    const primePicksProducts = db.prepare(`
      SELECT COUNT(*) as count FROM products 
      WHERE display_pages LIKE '%prime-picks%'
    `).get();
    console.log(`   Prime Picks products: ${primePicksProducts.count}`);
    
  } catch (error) {
    console.log('❌ products table does not exist');
  }
  
  // Check amazon_products table
  console.log('\n📋 AMAZON_PRODUCTS TABLE:');
  try {
    const amazonCount = db.prepare("SELECT COUNT(*) as count FROM amazon_products").get();
    console.log(`✅ amazon_products table exists with ${amazonCount.count} records`);
    
    const primePicksAmazon = db.prepare(`
      SELECT COUNT(*) as count FROM amazon_products 
      WHERE content_type = 'prime-picks' OR category = 'prime-picks'
    `).get();
    console.log(`   Prime Picks Amazon products: ${primePicksAmazon.count}`);
    
  } catch (error) {
    console.log('❌ amazon_products table does not exist');
  }
  
  // Check recent data in all relevant tables
  console.log('\n📈 RECENT DATA:');
  
  // Recent unified_content
  try {
    const recentUnified = db.prepare(`
      SELECT title, source_id, display_pages, created_at 
      FROM unified_content 
      ORDER BY created_at DESC 
      LIMIT 3
    `).all();
    
    if (recentUnified.length > 0) {
      console.log('Recent unified_content entries:');
      recentUnified.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.source_id}) - ${item.display_pages}`);
      });
    }
  } catch (error) {
    console.log('No recent unified_content data');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}