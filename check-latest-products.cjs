const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

try {
  console.log('🔍 Checking database structure and products...\n');

  // First, check the table structure
  console.log('📋 Products table structure:');
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  tableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  console.log('\n📊 Total products count:');
  const count = db.prepare("SELECT COUNT(*) as count FROM products").get();
  console.log(`  Total: ${count.count} products`);

  console.log('\n📝 Latest 10 products:');
  const stmt = db.prepare(`
    SELECT id, name, description, price, category, source
    FROM products 
    ORDER BY id DESC 
    LIMIT 10
  `);
  
  const products = stmt.all();
  
  if (products.length === 0) {
    console.log('  ❌ No products found in database');
  } else {
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ID: ${product.id}, Name: "${product.name}", Price: ${product.price}, Category: ${product.category}, Source: ${product.source || 'N/A'}`);
    });
  }

  // Check specifically for product named "1"
  console.log('\n🔍 Searching for product named "1":');
  const productOne = db.prepare("SELECT * FROM products WHERE name = ?").get('1');
  
  if (productOne) {
    console.log('  ✅ Found product named "1":');
    console.log(`     ID: ${productOne.id}`);
    console.log(`     Name: ${productOne.name}`);
    console.log(`     Description: ${productOne.description}`);
    console.log(`     Price: ${productOne.price}`);
    console.log(`     Category: ${productOne.category}`);
    console.log(`     Source: ${productOne.source || 'N/A'}`);
  } else {
    console.log('  ❌ No product named "1" found');
  }

} catch (error) {
  console.error('❌ Error checking products:', error);
} finally {
  db.close();
}