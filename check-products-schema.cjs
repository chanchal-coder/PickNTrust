const Database = require('better-sqlite3');
const path = require('path');

console.log('Search Checking products table schema and data...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Check products table structure
  console.log('\nStats Products table structure:');
  const columns = db.prepare("PRAGMA table_info(products)").all();
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Check for any existing products
  console.log('\n📋 Current products in database:');
  const products = db.prepare("SELECT id, name, price, is_featured, is_service, created_at FROM products LIMIT 5").all();
  if (products.length > 0) {
    products.forEach(product => {
      console.log(`  - ID: ${product.id}, Name: ${product.name}, Price: ${product.price}, Featured: ${product.is_featured}, Service: ${product.is_service}`);
    });
    console.log(`  Total products: ${db.prepare("SELECT COUNT(*) as count FROM products").get().count}`);
  } else {
    console.log('  No products found in database');
  }
  
  // Check for missing columns that might be expected by the code
  console.log('\nSearch Checking for potential schema issues:');
  
  const expectedColumns = [
    'id', 'name', 'description', 'price', 'original_price', 'image_url', 
    'affiliate_url', 'affiliate_network_id', 'category', 'gender', 'rating', 
    'review_count', 'discount', 'is_new', 'is_featured', 'is_service', 
    'custom_fields', 'has_timer', 'timer_duration', 'timer_start_time', 'created_at'
  ];
  
  const actualColumns = columns.map(col => col.name);
  
  expectedColumns.forEach(expectedCol => {
    if (actualColumns.includes(expectedCol)) {
      console.log(`  Success ${expectedCol} - EXISTS`);
    } else {
      console.log(`  Error ${expectedCol} - MISSING`);
    }
  });
  
  // Check data types that might cause issues
  console.log('\nWarning  Potential data type issues:');
  const problematicColumns = columns.filter(col => {
    // Check for columns that should be specific types
    if (col.name === 'price' && col.type !== 'NUMERIC' && col.type !== 'REAL') {
      return true;
    }
    if (col.name === 'rating' && col.type !== 'NUMERIC' && col.type !== 'REAL') {
      return true;
    }
    if ((col.name === 'is_featured' || col.name === 'is_service') && col.type !== 'INTEGER') {
      return true;
    }
    return false;
  });
  
  if (problematicColumns.length > 0) {
    problematicColumns.forEach(col => {
      console.log(`  Warning  ${col.name}: ${col.type} (might cause validation issues)`);
    });
  } else {
    console.log('  Success No obvious data type issues found');
  }
  
  // Test a simple insert to see what fails
  console.log('\n🧪 Testing simple product insertion:');
  try {
    const testInsert = db.prepare(`
      INSERT INTO products (
        name, description, price, image_url, affiliate_url, category, 
        rating, review_count, is_featured, is_service, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = testInsert.run(
      'Test Product Schema Check',
      'Testing schema compatibility',
      1999.99,
      'https://example.com/image.jpg',
      'https://example.com/affiliate',
      'Electronics & Gadgets',
      4.5,
      100,
      1,
      0,
      new Date().toISOString()
    );
    
    console.log(`  Success Test insertion successful! New product ID: ${result.lastInsertRowid}`);
    
    // Clean up test product
    db.prepare("DELETE FROM products WHERE id = ?").run(result.lastInsertRowid);
    console.log(`  Cleanup Test product cleaned up`);
    
  } catch (insertError) {
    console.log(`  Error Test insertion failed: ${insertError.message}`);
  }
  
} catch (error) {
  console.error('Error Error checking products schema:', error.message);
} finally {
  db.close();
  console.log('\nDatabase connection closed');
}
