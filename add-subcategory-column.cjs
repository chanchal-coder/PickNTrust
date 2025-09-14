const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Adding subcategory column to products table...');

// Find the database file
let dbPath = 'database.sqlite';
if (!fs.existsSync(dbPath)) {
  dbPath = 'sqlite.db';
  if (!fs.existsSync(dbPath)) {
    console.error('Error Database file not found!');
    process.exit(1);
  }
}

console.log(`📂 Using database: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  // Check if subcategory column already exists
  const tableInfo = db.prepare(`PRAGMA table_info(products)`).all();
  const hasSubcategory = tableInfo.some(col => col.name === 'subcategory');
  
  if (hasSubcategory) {
    console.log('Success subcategory column already exists in products table');
  } else {
    console.log('➕ Adding subcategory column to products table...');
    
    // Add the subcategory column
    db.prepare(`ALTER TABLE products ADD COLUMN subcategory TEXT`).run();
    
    console.log('Success subcategory column added successfully');
  }
  
  // Show current products table structure
  console.log('\n📋 Current products table structure:');
  const updatedTableInfo = db.prepare(`PRAGMA table_info(products)`).all();
  updatedTableInfo.forEach(col => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
    console.log(`  - ${col.name}: ${col.type} ${nullable}${defaultVal}`);
  });
  
  // Check if we have any products with categories that have subcategories
  console.log('\nSearch Checking for products that could use subcategories...');
  const productsWithCategories = db.prepare(`
    SELECT DISTINCT p.category, COUNT(*) as product_count
    FROM products p
    GROUP BY p.category
    ORDER BY product_count DESC
    LIMIT 10
  `).all();
  
  console.log('Top categories with products:');
  productsWithCategories.forEach(cat => {
    console.log(`  - ${cat.category}: ${cat.product_count} products`);
  });
  
  db.close();
  console.log('\nSuccess Database migration completed successfully!');
  
} catch (error) {
  console.error('Error Error adding subcategory column:', error.message);
  process.exit(1);
}