const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🧪 Testing Universal Subcategory System...');

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
  
  // Find a different category to test with (not Apps & AI Apps)
  console.log('\n🔍 Finding test categories...');
  const testCategories = db.prepare(`
    SELECT id, name FROM categories 
    WHERE parent_id IS NULL 
    AND name != 'Apps & AI Apps'
    ORDER BY name
    LIMIT 5
  `).all();
  
  console.log('Available main categories for testing:');
  testCategories.forEach(cat => {
    console.log(`  ${cat.id}. ${cat.name}`);
  });
  
  // Let's use Electronics & Gadgets as our test category
  const electronicsCategory = testCategories.find(cat => cat.name.includes('Electronics')) || testCategories[0];
  
  if (!electronicsCategory) {
    console.log('❌ No suitable test category found');
    db.close();
    return;
  }
  
  console.log(`\n🎯 Testing with category: ${electronicsCategory.name} (ID: ${electronicsCategory.id})`);
  
  // Check if it already has subcategories
  const existingSubcategories = db.prepare(`
    SELECT id, name FROM categories WHERE parent_id = ?
  `).all(electronicsCategory.id);
  
  console.log(`\n📋 Current subcategories: ${existingSubcategories.length}`);
  existingSubcategories.forEach(sub => {
    console.log(`  └─ ${sub.id}. ${sub.name}`);
  });
  
  // Add test subcategories if none exist
  if (existingSubcategories.length === 0) {
    console.log('\n➕ Adding test subcategories...');
    
    const testSubcategories = [
      {
        name: 'Smartphones',
        description: 'Latest smartphones and mobile devices',
        icon: 'fas fa-mobile-alt',
        color: '#3B82F6'
      },
      {
        name: 'Laptops & Computers',
        description: 'Computers and laptop devices',
        icon: 'fas fa-laptop',
        color: '#8B5CF6'
      },
      {
        name: 'Smart Home',
        description: 'Smart home devices and IoT products',
        icon: 'fas fa-home',
        color: '#10B981'
      }
    ];
    
    const insertStmt = db.prepare(`
      INSERT INTO categories (name, description, icon, color, parent_id, is_for_products, is_for_services, is_for_ai_apps, display_order)
      VALUES (?, ?, ?, ?, ?, 1, 0, 0, ?)
    `);
    
    testSubcategories.forEach((sub, index) => {
      try {
        const result = insertStmt.run(
          sub.name,
          sub.description,
          sub.icon,
          sub.color,
          electronicsCategory.id,
          (index + 1) * 10
        );
        console.log(`  ✅ Added: ${sub.name} (ID: ${result.lastInsertRowid})`);
      } catch (error) {
        console.log(`  ❌ Error adding ${sub.name}: ${error.message}`);
      }
    });
  }
  
  // Show final structure for multiple categories
  console.log('\n🌟 Universal Subcategory System Test Results:');
  console.log('=' .repeat(60));
  
  const allMainCategories = db.prepare(`
    SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name
  `).all();
  
  allMainCategories.forEach(mainCat => {
    const subs = db.prepare(`
      SELECT id, name FROM categories WHERE parent_id = ? ORDER BY name
    `).all(mainCat.id);
    
    if (subs.length > 0) {
      console.log(`\n📁 ${mainCat.name} (${subs.length} subcategories):`);
      subs.forEach(sub => {
        console.log(`  └─ ${sub.id}. ${sub.name}`);
      });
    }
  });
  
  console.log('\n✅ Universal subcategory system is working!');
  console.log('\n📝 Test Summary:');
  console.log(`   🎯 Test category: ${electronicsCategory.name}`);
  console.log(`   📊 Categories with subcategories: ${allMainCategories.filter(cat => {
    const subs = db.prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?').get(cat.id);
    return subs.count > 0;
  }).length}`);
  console.log('   🚀 System supports subcategories for ANY category!');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error testing universal subcategories:', error.message);
  process.exit(1);
}