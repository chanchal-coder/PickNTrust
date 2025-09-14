const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Setting up display order values for demonstration...');

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
  
  console.log('\nStats Setting up proper display order values...');
  
  // Get first 15 categories to set up demo values
  const categories = db.prepare(`
    SELECT id, name 
    FROM categories 
    ORDER BY id 
    LIMIT 15
  `).all();
  
  console.log(`\nTarget Found ${categories.length} categories to update:`);
  
  // Set display order values: 10, 20, 30, 40, etc.
  categories.forEach((cat, index) => {
    const order = (index + 1) * 10;
    
    const result = db.prepare(`
      UPDATE categories 
      SET display_order = ? 
      WHERE id = ?
    `).run(order, cat.id);
    
    if (result.changes > 0) {
      console.log(`  Success ${cat.name} → Order: ${order}`);
    } else {
      console.log(`  Error Failed to update ${cat.name}`);
    }
  });
  
  // Show the results
  console.log('\n📋 Current display order values:');
  const updatedCategories = db.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    WHERE display_order > 0
    ORDER BY display_order 
    LIMIT 10
  `).all();
  
  updatedCategories.forEach(cat => {
    console.log(`  ${cat.display_order}: ${cat.name}`);
  });
  
  db.close();
  
  console.log('\nCelebration Display order setup complete!');
  console.log('\nTip HOW THE SYSTEM WORKS:');
  console.log('   1. Each category has a "display_order" number');
  console.log('   2. Lower numbers appear FIRST (10 comes before 20)');
  console.log('   3. You can type any number in the "Order:" field');
  console.log('   4. Categories automatically sort by this number');
  console.log('   5. Use gaps (10, 20, 30) so you can insert between them');
  console.log('\n🔧 NEXT STEPS:');
  console.log('   1. Refresh the admin page');
  console.log('   2. You should now see numbers instead of 0');
  console.log('   3. Try changing a number to see reordering');
  console.log('   4. Lower numbers = higher priority (appear first)');
  
} catch (error) {
  console.error('Error Setup failed:', error.message);
  process.exit(1);
}