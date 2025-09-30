const Database = require('better-sqlite3');

try {
  const db = new Database('./database.db');
  
  console.log('=== Database Tables ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => console.log(`- ${table.name}`));
  
  console.log('\n=== Products Table Count ===');
  try {
    const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    console.log(`Products: ${productsCount.count}`);
  } catch (e) {
    console.log('Products table not found');
  }
  
  console.log('\n=== Featured Products Table Count ===');
  try {
    const featuredCount = db.prepare('SELECT COUNT(*) as count FROM featured_products').get();
    console.log(`Featured Products: ${featuredCount.count}`);
  } catch (e) {
    console.log('Featured products table not found');
  }
  
  console.log('\n=== Unified Content Table Count ===');
  try {
    const unifiedCount = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(`Unified Content: ${unifiedCount.count}`);
    
    const featuredUnified = db.prepare('SELECT COUNT(*) as count FROM unified_content WHERE isFeatured = 1').get();
    console.log(`Featured in Unified Content: ${featuredUnified.count}`);
  } catch (e) {
    console.log('Unified content table not found');
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}