const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🧪 Testing subcategory functionality...');

// Find the database file
let dbPath = 'database.sqlite';
if (!fs.existsSync(dbPath)) {
  dbPath = 'sqlite.db';
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found!');
    process.exit(1);
  }
}

console.log(`📂 Using database: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  // First, let's see the current categories structure
  console.log('\n📋 Current categories structure:');
  const allCategories = db.prepare(`
    SELECT id, name, parent_id, 
           CASE WHEN parent_id IS NULL THEN 'Main Category' ELSE 'Subcategory' END as type
    FROM categories 
    ORDER BY COALESCE(parent_id, id), parent_id IS NULL DESC, id
  `).all();
  
  allCategories.forEach(cat => {
    const indent = cat.parent_id ? '  └─ ' : '';
    console.log(`  ${indent}${cat.id}. ${cat.name} (${cat.type})`);
  });
  
  // Find a main category to use as parent (let's use the first one)
  const mainCategories = db.prepare(`
    SELECT id, name FROM categories WHERE parent_id IS NULL LIMIT 3
  `).all();
  
  if (mainCategories.length === 0) {
    console.log('\n❌ No main categories found to create subcategories under.');
    db.close();
    return;
  }
  
  console.log('\n🔧 Creating test subcategories...');
  
  // Create test subcategories for the first main category
  const parentCategory = mainCategories[0];
  console.log(`\n📁 Creating subcategories under: ${parentCategory.name} (ID: ${parentCategory.id})`);
  
  const testSubcategories = [
    {
      name: `${parentCategory.name} - Premium`,
      description: `Premium ${parentCategory.name.toLowerCase()} products`,
      icon: 'fas fa-crown',
      color: '#FFD700',
      parent_id: parentCategory.id,
      is_for_products: 1,
      is_for_services: 0,
      is_for_ai_apps: 0,
      display_order: 10
    },
    {
      name: `${parentCategory.name} - Budget`,
      description: `Budget-friendly ${parentCategory.name.toLowerCase()} options`,
      icon: 'fas fa-dollar-sign',
      color: '#32CD32',
      parent_id: parentCategory.id,
      is_for_products: 1,
      is_for_services: 0,
      is_for_ai_apps: 0,
      display_order: 20
    }
  ];
  
  const insertStmt = db.prepare(`
    INSERT INTO categories (name, description, icon, color, parent_id, is_for_products, is_for_services, is_for_ai_apps, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  testSubcategories.forEach(subcat => {
    try {
      const result = insertStmt.run(
        subcat.name,
        subcat.description,
        subcat.icon,
        subcat.color,
        subcat.parent_id,
        subcat.is_for_products,
        subcat.is_for_services,
        subcat.is_for_ai_apps,
        subcat.display_order
      );
      console.log(`  ✅ Created subcategory: ${subcat.name} (ID: ${result.lastInsertRowid})`);
    } catch (error) {
      console.log(`  ❌ Failed to create ${subcat.name}: ${error.message}`);
    }
  });
  
  // Show the updated structure
  console.log('\n📋 Updated categories structure:');
  const updatedCategories = db.prepare(`
    SELECT id, name, parent_id, 
           CASE WHEN parent_id IS NULL THEN 'Main Category' ELSE 'Subcategory' END as type
    FROM categories 
    ORDER BY COALESCE(parent_id, id), parent_id IS NULL DESC, id
  `).all();
  
  updatedCategories.forEach(cat => {
    const indent = cat.parent_id ? '  └─ ' : '';
    console.log(`  ${indent}${cat.id}. ${cat.name} (${cat.type})`);
  });
  
  // Test the new API endpoints
  console.log('\n🔍 Testing API endpoint queries...');
  
  // Test main categories query
  const mainCats = db.prepare(`
    SELECT id, name FROM categories WHERE parent_id IS NULL
  `).all();
  console.log(`\n📊 Main categories: ${mainCats.length}`);
  mainCats.forEach(cat => console.log(`  - ${cat.name}`));
  
  // Test subcategories query for the parent we used
  const subcats = db.prepare(`
    SELECT id, name FROM categories WHERE parent_id = ?
  `).all(parentCategory.id);
  console.log(`\n📊 Subcategories under '${parentCategory.name}': ${subcats.length}`);
  subcats.forEach(cat => console.log(`  - ${cat.name}`));
  
  console.log('\n✅ Subcategory functionality test completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Go to /admin and navigate to Categories tab');
  console.log('   3. You should see the hierarchical category structure');
  console.log('   4. Try creating, editing, and deleting subcategories');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error testing subcategory functionality:', error.message);
  process.exit(1);
}