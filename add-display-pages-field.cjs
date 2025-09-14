const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Refresh Adding display_pages field to products table...');

try {
  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const columnExists = tableInfo.some(col => col.name === 'display_pages');
  
  if (columnExists) {
    console.log('Success display_pages column already exists');
  } else {
    // Add the display_pages column
    db.exec(`
      ALTER TABLE products 
      ADD COLUMN display_pages TEXT DEFAULT '["home"]';
    `);
    console.log('Success Added display_pages column to products table');
  }
  
  // Update existing products to have 'home' as default display page
  const updateResult = db.prepare(`
    UPDATE products 
    SET display_pages = '["home"]' 
    WHERE display_pages IS NULL OR display_pages = ''
  `).run();
  
  console.log(`Success Updated ${updateResult.changes} existing products with default display_pages`);
  
  // Verify the changes
  const sampleProducts = db.prepare(`
    SELECT id, name, category, display_pages 
    FROM products 
    LIMIT 5
  `).all();
  
  console.log('\n📋 Sample products with display_pages:');
  sampleProducts.forEach(product => {
    console.log(`- ID: ${product.id}, Name: ${product.name}, Category: ${product.category}, Pages: ${product.display_pages}`);
  });
  
  console.log('\nCelebration Migration completed successfully!');
  
} catch (error) {
  console.error('Error Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('\nBlog Next steps:');
console.log('1. Update admin forms to include page selection');
console.log('2. Modify Prime Picks page to fetch from database');
console.log('3. Update sidebar to show dynamic categories');
console.log('4. Create API endpoints for filtering');