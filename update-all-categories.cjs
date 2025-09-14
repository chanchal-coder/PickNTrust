const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Updating ALL categories with proper display order values...');

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
  
  console.log('\nStats Getting all categories...');
  const categories = db.prepare(`
    SELECT id, name 
    FROM categories 
    ORDER BY id
  `).all();
  
  console.log(`\nTarget Found ${categories.length} categories to update:`);
  
  // Update all categories with display order values: 10, 20, 30, 40, etc.
  categories.forEach((cat, index) => {
    const order = (index + 1) * 10;
    
    const result = db.prepare(`
      UPDATE categories 
      SET display_order = ? 
      WHERE id = ?
    `).run(order, cat.id);
    
    if (result.changes > 0) {
      console.log(`  Success ${cat.name} (ID: ${cat.id}) → Order: ${order}`);
    } else {
      console.log(`  Error Failed to update ${cat.name} (ID: ${cat.id})`);
    }
  });
  
  // Verify the updates
  console.log('\n📋 Verifying updates - First 10 categories by display order:');
  const updated = db.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    ORDER BY display_order 
    LIMIT 10
  `).all();
  
  updated.forEach(cat => {
    console.log(`  ${cat.display_order}: ${cat.name} (ID: ${cat.id})`);
  });
  
  // Check specific AI categories
  console.log('\nAI AI Categories display order:');
  const aiCategories = db.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    WHERE name LIKE '%AI%' 
    ORDER BY display_order
  `).all();
  
  aiCategories.forEach(cat => {
    console.log(`  ${cat.display_order}: ${cat.name} (ID: ${cat.id})`);
  });
  
  db.close();
  
  console.log('\nCelebration All categories updated successfully!');
  console.log('\nTip Next steps:');
  console.log('   1. Test the API endpoint: http://localhost:5000/api/categories');
  console.log('   2. Refresh the admin page');
  console.log('   3. You should now see proper display order numbers!');
  
} catch (error) {
  console.error('Error Update failed:', error.message);
  process.exit(1);
}