const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🧪 Testing category filtering functionality...');

try {
  // Connect to database
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log('✅ Connected to database');

  // Test 1: Check current categories structure
  console.log('\n📋 Current categories structure:');
  const categories = sqlite.prepare(`
    SELECT id, name, description, isForProducts, isForServices 
    FROM categories 
    ORDER BY id
  `).all();
  
  console.table(categories);

  // Test 2: Create test categories for different types
  console.log('\n🔧 Creating test categories...');
  
  // Product-only category
  sqlite.prepare(`
    INSERT OR REPLACE INTO categories (name, description, icon, color, isForProducts, isForServices)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Test Products Only', 'Category for products only', 'fas fa-box', '#3B82F6', 1, 0);

  // Service-only category
  sqlite.prepare(`
    INSERT OR REPLACE INTO categories (name, description, icon, color, isForProducts, isForServices)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Test Services Only', 'Category for services only', 'fas fa-cogs', '#10B981', 0, 1);

  // Both products and services
  sqlite.prepare(`
    INSERT OR REPLACE INTO categories (name, description, icon, color, isForProducts, isForServices)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Test Both Types', 'Category for both products and services', 'fas fa-star', '#F59E0B', 1, 1);

  console.log('✅ Test categories created');

  // Test 3: Query categories by type
  console.log('\n🔍 Testing category filtering queries...');

  const productCategories = sqlite.prepare(`
    SELECT name, isForProducts, isForServices 
    FROM categories 
    WHERE isForProducts = 1
  `).all();

  const serviceCategories = sqlite.prepare(`
    SELECT name, isForProducts, isForServices 
    FROM categories 
    WHERE isForServices = 1
  `).all();

  console.log('\n📦 Product Categories:');
  console.table(productCategories);

  console.log('\n🛠️ Service Categories:');
  console.table(serviceCategories);

  // Test 4: Test API endpoints (simulate)
  console.log('\n🌐 API endpoint simulation results:');
  console.log(`- /api/categories/products would return: ${productCategories.length} categories`);
  console.log(`- /api/categories/services would return: ${serviceCategories.length} categories`);
  console.log(`- /api/categories would return: ${categories.length + 3} categories (all)`);

  sqlite.close();
  console.log('\n🎉 Category filtering test completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
