const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('=== CURRENT DATABASE STATE ===\n');

try {
  // Check table structure
  const columns = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('📋 UNIFIED_CONTENT TABLE COLUMNS:');
  columns.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });

  // Check current products
  const products = db.prepare(`
    SELECT id, title, category, is_featured, display_pages, status
    FROM unified_content 
    ORDER BY id DESC
    LIMIT 10
  `).all();

  console.log(`\n📦 RECENT PRODUCTS (${products.length}):`);
  products.forEach(product => {
    console.log(`  ${product.id}: ${product.title}`);
    console.log(`    Category: ${product.category}`);
    console.log(`    Featured: ${product.is_featured}`);
    console.log(`    Display Pages: ${product.display_pages}`);
    console.log(`    Status: ${product.status}`);
    console.log('');
  });

  // Check if we have any test products
  const testProducts = db.prepare(`
    SELECT COUNT(*) as count FROM unified_content 
    WHERE title LIKE '%Test%' OR title LIKE '%Netflix%' OR title LIKE '%Spotify%' OR title LIKE '%ChatGPT%'
  `).get();

  console.log(`🧪 Test products found: ${testProducts.count}`);

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}