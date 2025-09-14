const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Fixing category display order to proper sequential values...');

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
  
  console.log('\nStats Getting all categories ordered by current display_order...');
  
  // Get all categories ordered by current display_order, then by name for consistency
  const categories = db.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    ORDER BY COALESCE(display_order, 999999), name
  `).all();
  
  console.log(`\nTarget Found ${categories.length} categories to reorder:`);
  
  // Reset all categories to proper sequential order: 10, 20, 30, 40, etc.
  categories.forEach((cat, index) => {
    const newOrder = (index + 1) * 10;
    
    const result = db.prepare(`
      UPDATE categories 
      SET display_order = ? 
      WHERE id = ?
    `).run(newOrder, cat.id);
    
    if (result.changes > 0) {
      console.log(`  Success ${cat.name} (ID: ${cat.id}) → Order: ${newOrder}`);
    } else {
      console.log(`  Error Failed to update ${cat.name} (ID: ${cat.id})`);
    }
  });
  
  // Verify the results
  console.log('\n📋 Verification - First 10 categories by new display order:');
  const verification = db.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    ORDER BY display_order 
    LIMIT 10
  `).all();
  
  verification.forEach(cat => {
    console.log(`  ${cat.display_order}: ${cat.name} (ID: ${cat.id})`);
  });
  
  // Show AI categories specifically
  console.log('\nAI AI Categories with new display order:');
  const aiCategories = db.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    WHERE name LIKE '%AI%' 
    ORDER BY display_order
    LIMIT 10
  `).all();
  
  aiCategories.forEach(cat => {
    console.log(`  ${cat.display_order}: ${cat.name} (ID: ${cat.id})`);
  });
  
  // Show the range
  const minMax = db.prepare(`
    SELECT 
      MIN(display_order) as min_order,
      MAX(display_order) as max_order,
      COUNT(*) as total_categories
    FROM categories
  `).get();
  
  console.log('\nStats Summary:');
  console.log(`  Total categories: ${minMax.total_categories}`);
  console.log(`  Display order range: ${minMax.min_order} - ${minMax.max_order}`);
  console.log(`  Proper sequential order: Success`);
  
  db.close();
  
  console.log('\nCelebration Category display order fixed!');
  console.log('\nTip Now categories have proper sequential order:');
  console.log('   - Range: 10 to ' + (categories.length * 10));
  console.log('   - Increment: 10 (allows easy insertion)');
  console.log('   - Total: ' + categories.length + ' categories');
  console.log('\n🔧 Next: Admin interface should now show reasonable numbers!');
  
} catch (error) {
  console.error('Error Fix failed:', error.message);
  process.exit(1);
}