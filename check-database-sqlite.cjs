const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking database.sqlite (Server Database)...');
console.log('==================================================\n');

try {
  // Check if products table exists
  console.log('📋 Tables in database.sqlite:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });

  // Check products table if it exists
  if (tables.some(t => t.name === 'products')) {
    console.log('\n📊 Products Table:');
    const products = db.prepare('SELECT id, name, display_pages FROM products ORDER BY created_at DESC').all();
    console.log(`   Total products: ${products.length}`);
    
    if (products.length > 0) {
      products.forEach(product => {
        console.log(`   ID ${product.id}: ${product.name} -> ${product.display_pages}`);
      });
    }

    // Check distribution by display_pages
    console.log('\n📈 Distribution by Display Pages:');
    const distribution = db.prepare(`
      SELECT display_pages, COUNT(*) as count 
      FROM products 
      GROUP BY display_pages
    `).all();
    
    distribution.forEach(item => {
      console.log(`   ${item.display_pages}: ${item.count} products`);
    });
  } else {
    console.log('\n❌ Products table does not exist in database.sqlite');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}