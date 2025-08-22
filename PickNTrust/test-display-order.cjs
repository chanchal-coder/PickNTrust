const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🧪 Testing category display order functionality...');

try {
  // Connect to database
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log('✅ Connected to database');

  // Test 1: Check current categories with display order
  console.log('\n📋 1. Current Categories with Display Order');
  console.log('-'.repeat(50));
  
  const categories = sqlite.prepare(`
    SELECT id, name, display_order, is_for_products, is_for_services 
    FROM categories 
    ORDER BY display_order ASC, name ASC
  `).all();

  console.log('Categories ordered by display_order:');
  console.table(categories);

  // Test 2: Simulate reordering categories
  console.log('\n🔄 2. Testing Category Reordering');
  console.log('-'.repeat(50));
  
  if (categories.length >= 3) {
    // Simulate reordering - reverse the order of first 3 categories
    const reorderData = [
      { id: categories[0].id, displayOrder: 30 },
      { id: categories[1].id, displayOrder: 20 },
      { id: categories[2].id, displayOrder: 10 }
    ];

    console.log('Applying new display order:');
    console.table(reorderData);

    // Update display orders
    reorderData.forEach(item => {
      sqlite.prepare(`
        UPDATE categories 
        SET display_order = ? 
        WHERE id = ?
      `).run(item.displayOrder, item.id);
    });

    console.log('✅ Display order updated');

    // Verify the changes
    const reorderedCategories = sqlite.prepare(`
      SELECT id, name, display_order 
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `).all();

    console.log('\nCategories after reordering:');
    console.table(reorderedCategories);
  } else {
    console.log('⚠️  Not enough categories to test reordering (need at least 3)');
  }

  // Test 3: Test API endpoint simulation
  console.log('\n🌐 3. API Endpoint Simulation');
  console.log('-'.repeat(50));
  
  // Simulate GET /api/categories (should return ordered categories)
  const orderedCategories = sqlite.prepare(`
    SELECT * FROM categories 
    ORDER BY display_order ASC, name ASC
  `).all();

  console.log('GET /api/categories response (ordered by display_order):');
  console.table(orderedCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    displayOrder: cat.display_order,
    isForProducts: cat.is_for_products,
    isForServices: cat.is_for_services
  })));

  // Test 4: Test filtered categories with display order
  console.log('\n📂 4. Filtered Categories with Display Order');
  console.log('-'.repeat(50));
  
  const productCategories = sqlite.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    WHERE is_for_products = 1 
    ORDER BY display_order ASC, name ASC
  `).all();

  const serviceCategories = sqlite.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    WHERE is_for_services = 1 
    ORDER BY display_order ASC, name ASC
  `).all();

  console.log('Product categories (ordered):');
  console.table(productCategories);

  console.log('Service categories (ordered):');
  console.table(serviceCategories);

  // Test 5: Add a new category and verify default display order
  console.log('\n➕ 5. Testing New Category Display Order');
  console.log('-'.repeat(50));
  
  // Get the highest display order
  const maxOrder = sqlite.prepare(`
    SELECT MAX(display_order) as max_order FROM categories
  `).get();

  const newDisplayOrder = (maxOrder.max_order || 0) + 10;

  // Insert a test category
  const testCategoryId = sqlite.prepare(`
    INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Test Category',
    'fas fa-test',
    'from-blue-500 to-purple-600',
    'Test category for display order',
    newDisplayOrder,
    1,
    0
  ).lastInsertRowid;

  console.log(`✅ Created test category with ID: ${testCategoryId}, display_order: ${newDisplayOrder}`);

  // Verify it appears at the end
  const finalCategories = sqlite.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    ORDER BY display_order ASC, name ASC
  `).all();

  console.log('Final category order:');
  console.table(finalCategories);

  // Clean up - remove test category
  sqlite.prepare(`DELETE FROM categories WHERE id = ?`).run(testCategoryId);
  console.log('🧹 Cleaned up test category');

  // Test 6: Performance check
  console.log('\n⚡ 6. Performance Check');
  console.log('-'.repeat(50));
  
  const startTime = Date.now();
  for (let i = 0; i < 100; i++) {
    sqlite.prepare(`
      SELECT * FROM categories 
      ORDER BY display_order ASC, name ASC
    `).all();
  }
  const endTime = Date.now();

  console.log(`✅ 100 ordered queries completed in ${endTime - startTime}ms`);
  console.log(`Average: ${(endTime - startTime) / 100}ms per query`);

  sqlite.close();
  console.log('\n🎉 Display order functionality test completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
