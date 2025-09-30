const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== RECREATING CATEGORIES TABLE ===');
  
  // Drop existing categories table if it exists
  console.log('\n1. Dropping existing categories table if it exists...');
  db.exec('DROP TABLE IF EXISTS categories');
  
  // Create categories table with proper schema
  console.log('\n2. Creating categories table...');
  db.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT DEFAULT '#3B82F6',
      description TEXT,
      parent_id INTEGER,
      is_for_products INTEGER DEFAULT 1,
      is_for_services INTEGER DEFAULT 0,
      is_for_ai_apps INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `);
  
  console.log('✅ Categories table created successfully');
  
  // Get unique categories from unified_content
  console.log('\n3. Extracting unique categories from unified_content...');
  const uniqueCategories = db.prepare(`
    SELECT DISTINCT category 
    FROM unified_content 
    WHERE category IS NOT NULL 
      AND category != '' 
      AND category != 'null'
    ORDER BY category
  `).all();
  
  console.log('Found categories:', uniqueCategories.map(c => c.category));
  
  // Insert categories with proper data
  console.log('\n4. Inserting categories...');
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Define category mappings with icons and colors
  const categoryMappings = {
    'deals': { icon: '🔥', color: '#EF4444', description: 'Hot deals and discounts', order: 1, products: 1, services: 0, apps: 0 },
    'Electronics': { icon: '📱', color: '#3B82F6', description: 'Electronic devices and gadgets', order: 2, products: 1, services: 0, apps: 0 },
    'Technology': { icon: '💻', color: '#8B5CF6', description: 'Technology products and services', order: 3, products: 1, services: 1, apps: 1 },
    'Services': { icon: '🛠️', color: '#10B981', description: 'Professional services', order: 4, products: 0, services: 1, apps: 0 },
    'AI & Apps': { icon: '🤖', color: '#F59E0B', description: 'AI applications and software', order: 5, products: 0, services: 0, apps: 1 },
    'Software': { icon: '💾', color: '#6366F1', description: 'Software applications', order: 6, products: 1, services: 0, apps: 1 },
    'Gaming': { icon: '🎮', color: '#EC4899', description: 'Gaming products and accessories', order: 7, products: 1, services: 0, apps: 1 },
    'Health': { icon: '🏥', color: '#14B8A6', description: 'Health and wellness products', order: 8, products: 1, services: 1, apps: 0 },
    'Fashion': { icon: '👗', color: '#F97316', description: 'Fashion and clothing', order: 9, products: 1, services: 0, apps: 0 },
    'Home': { icon: '🏠', color: '#84CC16', description: 'Home and garden products', order: 10, products: 1, services: 1, apps: 0 }
  };
  
  let insertedCount = 0;
  
  // Insert categories found in unified_content
  for (const cat of uniqueCategories) {
    const categoryName = cat.category;
    const mapping = categoryMappings[categoryName] || {
      icon: '📦',
      color: '#6B7280',
      description: `${categoryName} category`,
      order: 100 + insertedCount,
      products: 1,
      services: 0,
      apps: 0
    };
    
    try {
      insertCategory.run(
        categoryName,
        mapping.icon,
        mapping.color,
        mapping.description,
        mapping.order,
        mapping.products,
        mapping.services,
        mapping.apps
      );
      insertedCount++;
      console.log(`✅ Inserted category: ${categoryName}`);
    } catch (error) {
      console.log(`⚠️  Skipped duplicate category: ${categoryName}`);
    }
  }
  
  // Insert essential categories that might not be in unified_content
  const essentialCategories = ['Services', 'AI & Apps'];
  for (const catName of essentialCategories) {
    if (!uniqueCategories.find(c => c.category === catName)) {
      const mapping = categoryMappings[catName];
      try {
        insertCategory.run(
          catName,
          mapping.icon,
          mapping.color,
          mapping.description,
          mapping.order,
          mapping.products,
          mapping.services,
          mapping.apps
        );
        insertedCount++;
        console.log(`✅ Inserted essential category: ${catName}`);
      } catch (error) {
        console.log(`⚠️  Essential category already exists: ${catName}`);
      }
    }
  }
  
  console.log(`\n5. Total categories inserted: ${insertedCount}`);
  
  // Verify the categories table
  console.log('\n6. Verifying categories table...');
  const allCategories = db.prepare('SELECT * FROM categories ORDER BY display_order, name').all();
  console.log('All categories:');
  allCategories.forEach(cat => {
    console.log(`  - ${cat.name} (${cat.icon}) - Products: ${cat.is_for_products}, Services: ${cat.is_for_services}, Apps: ${cat.is_for_ai_apps}`);
  });
  
  db.close();
  console.log('\n=== CATEGORIES TABLE RECREATION COMPLETE ===');
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}