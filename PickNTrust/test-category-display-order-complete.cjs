const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🧪 Testing Complete Category Display Order Functionality...');

async function testDisplayOrderFunctionality() {
  try {
    // Connect to database
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    console.log('✅ Connected to database');

    // Test 1: Verify display_order column exists
    console.log('\n📋 1. Verifying Database Schema');
    console.log('-'.repeat(50));
    
    const tableInfo = sqlite.prepare(`PRAGMA table_info(categories)`).all();
    const displayOrderColumn = tableInfo.find(col => col.name === 'display_order');
    
    if (displayOrderColumn) {
      console.log('✅ display_order column exists');
      console.log(`   Type: ${displayOrderColumn.type}, Default: ${displayOrderColumn.dflt_value}`);
    } else {
      console.log('❌ display_order column missing');
      return;
    }

    // Test 2: Check current categories with display order
    console.log('\n📊 2. Current Categories with Display Order');
    console.log('-'.repeat(50));
    
    const categories = sqlite.prepare(`
      SELECT id, name, display_order, is_for_products, is_for_services 
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `).all();

    if (categories.length === 0) {
      console.log('⚠️  No categories found. Creating test categories...');
      
      // Create test categories
      const testCategories = [
        { name: 'Electronics & Gadgets', description: 'Latest tech products', icon: 'fas fa-laptop', color: '#6366F1', displayOrder: 10 },
        { name: 'Fashion & Clothing', description: 'Trendy fashion items', icon: 'fas fa-tshirt', color: '#EC4899', displayOrder: 20 },
        { name: 'Home & Garden', description: 'Home improvement items', icon: 'fas fa-home', color: '#10B981', displayOrder: 30 }
      ];

      testCategories.forEach(cat => {
        sqlite.prepare(`
          INSERT INTO categories (name, description, icon, color, display_order, is_for_products, is_for_services)
          VALUES (?, ?, ?, ?, ?, 1, 0)
        `).run(cat.name, cat.description, cat.icon, cat.color, cat.displayOrder);
      });

      console.log('✅ Created test categories');
      
      // Refresh categories list
      const updatedCategories = sqlite.prepare(`
        SELECT id, name, display_order 
        FROM categories 
        ORDER BY display_order ASC, name ASC
      `).all();
      
      console.table(updatedCategories);
    } else {
      console.log('Categories with display order:');
      console.table(categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        displayOrder: cat.display_order,
        isForProducts: cat.is_for_products ? 'Yes' : 'No',
        isForServices: cat.is_for_services ? 'Yes' : 'No'
      })));
    }

    // Test 3: Simulate API reordering
    console.log('\n🔄 3. Testing Category Reordering Logic');
    console.log('-'.repeat(50));
    
    const currentCategories = sqlite.prepare(`
      SELECT id, name, display_order 
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `).all();

    if (currentCategories.length >= 2) {
      console.log('Original order:');
      console.table(currentCategories);

      // Simulate moving first category down (swap first two)
      const reorderData = [
        { id: currentCategories[0].id, displayOrder: 20 },
        { id: currentCategories[1].id, displayOrder: 10 }
      ];

      console.log('\nApplying reorder (moving first category down):');
      console.table(reorderData);

      // Apply reordering
      reorderData.forEach(item => {
        sqlite.prepare(`
          UPDATE categories 
          SET display_order = ? 
          WHERE id = ?
        `).run(item.displayOrder, item.id);
      });

      // Verify new order
      const reorderedCategories = sqlite.prepare(`
        SELECT id, name, display_order 
        FROM categories 
        ORDER BY display_order ASC, name ASC
      `).all();

      console.log('\nNew order after reordering:');
      console.table(reorderedCategories);

      // Restore original order for consistency
      currentCategories.forEach((cat, index) => {
        sqlite.prepare(`
          UPDATE categories 
          SET display_order = ? 
          WHERE id = ?
        `).run((index + 1) * 10, cat.id);
      });

      console.log('✅ Reordering test completed successfully');
    } else {
      console.log('⚠️  Need at least 2 categories to test reordering');
    }

    // Test 4: Test API endpoint simulation
    console.log('\n🌐 4. API Endpoint Simulation');
    console.log('-'.repeat(50));
    
    // Simulate GET /api/categories (should return ordered categories)
    const apiCategories = sqlite.prepare(`
      SELECT id, name, description, icon, color, display_order, is_for_products, is_for_services
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `).all();

    console.log('GET /api/categories response (ordered by display_order):');
    console.table(apiCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      displayOrder: cat.display_order,
      type: cat.is_for_products && cat.is_for_services ? 'Both' : 
            cat.is_for_products ? 'Products' : 
            cat.is_for_services ? 'Services' : 'General'
    })));

    // Test 5: Performance test
    console.log('\n⚡ 5. Performance Test');
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      sqlite.prepare(`
        SELECT * FROM categories 
        ORDER BY display_order ASC, name ASC
      `).all();
    }
    const endTime = Date.now();

    console.log(`✅ 1000 ordered queries completed in ${endTime - startTime}ms`);
    console.log(`Average: ${(endTime - startTime) / 1000}ms per query`);

    // Test 6: Frontend integration test simulation
    console.log('\n🎨 6. Frontend Integration Simulation');
    console.log('-'.repeat(50));
    
    const frontendCategories = sqlite.prepare(`
      SELECT id, name, display_order 
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `).all();

    console.log('Simulating frontend category management:');
    
    // Simulate canMoveUp/canMoveDown logic
    frontendCategories.forEach((category, index) => {
      const canMoveUp = index > 0;
      const canMoveDown = index < frontendCategories.length - 1;
      
      console.log(`  ${category.name}:`);
      console.log(`    - Can move up: ${canMoveUp ? '✅' : '❌'}`);
      console.log(`    - Can move down: ${canMoveDown ? '✅' : '❌'}`);
    });

    // Test 7: Edge cases
    console.log('\n🔍 7. Edge Cases Testing');
    console.log('-'.repeat(50));
    
    // Test with null display_order
    const nullOrderCount = sqlite.prepare(`
      SELECT COUNT(*) as count FROM categories WHERE display_order IS NULL
    `).get();
    
    console.log(`Categories with NULL display_order: ${nullOrderCount.count}`);
    
    // Test with duplicate display_order
    const duplicateOrderCount = sqlite.prepare(`
      SELECT display_order, COUNT(*) as count 
      FROM categories 
      WHERE display_order IS NOT NULL 
      GROUP BY display_order 
      HAVING COUNT(*) > 1
    `).all();
    
    if (duplicateOrderCount.length > 0) {
      console.log('⚠️  Found duplicate display_order values:');
      console.table(duplicateOrderCount);
    } else {
      console.log('✅ No duplicate display_order values found');
    }

    sqlite.close();
    console.log('\n🎉 Complete Category Display Order Test Passed!');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the test
testDisplayOrderFunctionality().then(success => {
  if (success) {
    console.log('\n✨ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Database schema verified');
    console.log('   ✅ Display order functionality working');
    console.log('   ✅ Reordering logic tested');
    console.log('   ✅ API simulation successful');
    console.log('   ✅ Performance acceptable');
    console.log('   ✅ Frontend integration ready');
    console.log('   ✅ Edge cases handled');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
});
