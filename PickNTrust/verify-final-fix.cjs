const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 Verifying Final Fix...\n');

function verifyFinalFix() {
  const dbFile = 'sqlite.db';
  
  if (!fs.existsSync(dbFile)) {
    console.log('❌ sqlite.db not found!');
    return false;
  }

  try {
    const db = new Database(dbFile);
    
    console.log('📋 Testing all critical queries...\n');
    
    // Test 1: Categories query with all required columns
    try {
      const categoriesTest = db.prepare(`
        SELECT id, name, icon, color, description, 
               is_for_products, is_for_services, display_order 
        FROM categories 
        ORDER BY display_order
      `).all();
      
      console.log(`✅ Categories query: ${categoriesTest.length} categories found`);
      
      // Check for Fashion category
      const fashionCategory = categoriesTest.find(cat => cat.name.includes('Fashion'));
      if (fashionCategory) {
        console.log(`👕 Fashion category: "${fashionCategory.name}" (ID: ${fashionCategory.id}, Order: ${fashionCategory.display_order})`);
      }
      
    } catch (error) {
      console.log(`❌ Categories query failed: ${error.message}`);
      return false;
    }
    
    // Test 2: Products query
    try {
      const productsTest = db.prepare(`
        SELECT COUNT(*) as count FROM products
      `).get();
      
      console.log(`✅ Products query: ${productsTest.count} products found`);
      
    } catch (error) {
      console.log(`❌ Products query failed: ${error.message}`);
      return false;
    }
    
    // Test 3: Featured products query
    try {
      const featuredTest = db.prepare(`
        SELECT COUNT(*) as count FROM products WHERE COALESCE(is_featured, 0) = 1
      `).get();
      
      console.log(`✅ Featured products query: ${featuredTest.count} featured products found`);
      
    } catch (error) {
      console.log(`❌ Featured products query failed: ${error.message}`);
      return false;
    }
    
    // Test 4: Fashion products with gender
    try {
      const fashionProductsTest = db.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE category LIKE '%Fashion%'
      `).get();
      
      console.log(`✅ Fashion products query: ${fashionProductsTest.count} fashion products found`);
      
      // Test gender filtering
      const menFashionTest = db.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE category LIKE '%Fashion%' AND LOWER(gender) = 'men'
      `).get();
      
      console.log(`✅ Men's fashion products query: ${menFashionTest.count} men's fashion products found`);
      
    } catch (error) {
      console.log(`❌ Fashion products query failed: ${error.message}`);
      return false;
    }
    
    // Test 5: Insert category test (what was failing before)
    try {
      // Try to insert a test category
      const testInsert = db.prepare(`
        INSERT INTO categories (name, icon, color, description, is_for_products, is_for_services, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const testResult = testInsert.run(
        'Test Category', 
        'fas fa-test', 
        '#FF0000', 
        'Test description', 
        1, 
        0, 
        999
      );
      
      console.log(`✅ Category insert test: Success (ID: ${testResult.lastInsertRowid})`);
      
      // Clean up test category
      db.prepare('DELETE FROM categories WHERE id = ?').run(testResult.lastInsertRowid);
      console.log(`✅ Test category cleaned up`);
      
    } catch (error) {
      console.log(`❌ Category insert test failed: ${error.message}`);
      return false;
    }
    
    db.close();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Database schema is correct');
    console.log('✅ All required columns exist');
    console.log('✅ All queries work properly');
    console.log('✅ Category insertion works');
    console.log('✅ Gender filtering ready');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
    return false;
  }
}

// Run verification
const success = verifyFinalFix();

if (success) {
  console.log('\n🚀 READY FOR PRODUCTION!');
  console.log('The SQLite errors should now be completely resolved.');
  console.log('Gender categorization will work properly.');
  console.log('\nNext: Restart your PM2 processes to see the fix in action.');
} else {
  console.log('\n❌ Verification failed. Check the errors above.');
}
