const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('Search Debugging Categories API Issue...');

async function debugCategoriesIssue() {
  try {
    // Connect to database
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    console.log('Success Connected to database');

    // Check if categories table exists
    console.log('\n📋 1. Checking Categories Table Structure');
    console.log('-'.repeat(50));
    
    const tableInfo = sqlite.prepare(`PRAGMA table_info(categories)`).all();
    
    if (tableInfo.length === 0) {
      console.log('Error Categories table does not exist!');
      return false;
    }
    
    console.log('Success Categories table exists with columns:');
    console.table(tableInfo.map(col => ({
      name: col.name,
      type: col.type,
      notNull: col.notnull ? 'YES' : 'NO',
      defaultValue: col.dflt_value || 'NULL'
    })));

    // Check if display_order column exists
    const displayOrderColumn = tableInfo.find(col => col.name === 'display_order');
    if (displayOrderColumn) {
      console.log('Success display_order column exists');
    } else {
      console.log('Warning  display_order column missing - running migration...');
      
      // Add display_order column if missing
      try {
        sqlite.prepare(`ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0`).run();
        console.log('Success Added display_order column');
        
        // Set initial display orders
        const categories = sqlite.prepare(`SELECT id FROM categories ORDER BY id`).all();
        categories.forEach((cat, index) => {
          sqlite.prepare(`UPDATE categories SET display_order = ? WHERE id = ?`).run((index + 1) * 10, cat.id);
        });
        console.log('Success Set initial display orders');
      } catch (error) {
        console.log('Warning  Column might already exist:', error.message);
      }
    }

    // Check categories data
    console.log('\nStats 2. Checking Categories Data');
    console.log('-'.repeat(50));
    
    const categoriesCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`Total categories: ${categoriesCount.count}`);
    
    if (categoriesCount.count === 0) {
      console.log('Warning  No categories found. Creating default categories...');
      
      const defaultCategories = [
        { name: 'Electronics & Gadgets', description: 'Latest tech and gadgets', icon: 'fas fa-laptop', color: '#6366F1', isForProducts: 1, isForServices: 0, displayOrder: 10 },
        { name: 'Fashion & Clothing', description: 'Trendy fashion items', icon: 'fas fa-tshirt', color: '#EC4899', isForProducts: 1, isForServices: 0, displayOrder: 20 },
        { name: 'Home & Garden', description: 'Home improvement items', icon: 'fas fa-home', color: '#10B981', isForProducts: 1, isForServices: 0, displayOrder: 30 },
        { name: 'Health & Beauty', description: 'Health and beauty products', icon: 'fas fa-heart', color: '#F59E0B', isForProducts: 1, isForServices: 0, displayOrder: 40 },
        { name: 'Sports & Fitness', description: 'Sports and fitness gear', icon: 'fas fa-dumbbell', color: '#EF4444', isForProducts: 1, isForServices: 0, displayOrder: 50 },
        { name: 'Digital Services', description: 'Apps, software and digital services', icon: 'fas fa-cloud', color: '#8B5CF6', isForProducts: 0, isForServices: 1, displayOrder: 60 }
      ];

      defaultCategories.forEach(cat => {
        sqlite.prepare(`
          INSERT INTO categories (name, description, icon, color, is_for_products, is_for_services, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(cat.name, cat.description, cat.icon, cat.color, cat.isForProducts, cat.isForServices, cat.displayOrder);
      });
      
      console.log('Success Created default categories');
    }

    // Display current categories
    const categories = sqlite.prepare(`
      SELECT id, name, description, icon, color, is_for_products, is_for_services, display_order
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `).all();

    console.log('\nCurrent categories:');
    console.table(categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      forProducts: cat.is_for_products ? 'Success' : 'Error',
      forServices: cat.is_for_services ? 'Success' : 'Error',
      displayOrder: cat.display_order || 0
    })));

    // Test API query simulation
    console.log('\nGlobal 3. Testing API Query Simulation');
    console.log('-'.repeat(50));
    
    try {
      // Simulate the exact query from storage.ts
      const apiCategories = sqlite.prepare(`
        SELECT id, name, description, icon, color, is_for_products, is_for_services, display_order
        FROM categories 
        ORDER BY display_order ASC, name ASC
      `).all();
      
      console.log('Success API query simulation successful');
      console.log(`Returned ${apiCategories.length} categories`);
      
      if (apiCategories.length > 0) {
        console.log('Sample category data:');
        console.log(JSON.stringify(apiCategories[0], null, 2));
      }
    } catch (error) {
      console.log('Error API query simulation failed:', error.message);
    }

    // Check for any database corruption
    console.log('\n🔧 4. Database Integrity Check');
    console.log('-'.repeat(50));
    
    try {
      const integrityCheck = sqlite.prepare(`PRAGMA integrity_check`).get();
      console.log('Database integrity:', integrityCheck.integrity_check || 'OK');
    } catch (error) {
      console.log('Warning  Integrity check failed:', error.message);
    }

    sqlite.close();
    console.log('\nSuccess Categories debugging completed');
    
    return true;

  } catch (error) {
    console.error('Error Debug failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the debug
debugCategoriesIssue().then(success => {
  if (success) {
    console.log('\nCelebration Categories debugging completed successfully!');
    console.log('\nBlog Next Steps:');
    console.log('   1. Restart your server');
    console.log('   2. Test the /api/categories endpoint');
    console.log('   3. Check the admin panel categories section');
  } else {
    console.log('\nError Categories debugging failed. Please check the errors above.');
    process.exit(1);
  }
});
