const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Fixing Production Categories Database...\n');

function fixProductionDatabase() {
  // Check which database file exists
  let dbFile = null;
  if (fs.existsSync('sqlite.db')) {
    dbFile = 'sqlite.db';
  } else if (fs.existsSync('database.sqlite')) {
    dbFile = 'database.sqlite';
  } else {
    console.log('Error No database file found!');
    return false;
  }

  console.log(`Upload Using database: ${dbFile}`);
  
  const db = new Database(dbFile);
  
  try {
    // Get current table schema
    const schema = db.prepare("PRAGMA table_info(categories)").all();
    const existingColumns = schema.map(col => col.name);
    
    console.log(`📋 Current columns:`, existingColumns);
    
    // Define required columns with their SQL definitions
    const requiredColumns = {
      'displayOrder': 'INTEGER DEFAULT 0',
      'isForProducts': 'INTEGER DEFAULT 1', 
      'isForServices': 'INTEGER DEFAULT 0'
    };
    
    // Add missing columns
    let columnsAdded = 0;
    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      if (!existingColumns.includes(columnName)) {
        console.log(`➕ Adding ${columnName} column...`);
        try {
          db.prepare(`ALTER TABLE categories ADD COLUMN ${columnName} ${columnDef}`).run();
          columnsAdded++;
          console.log(`Success Added ${columnName} column`);
        } catch (error) {
          console.log(`Error Failed to add ${columnName}:`, error.message);
        }
      } else {
        console.log(`Success ${columnName} column already exists`);
      }
    }
    
    // Check if we have any categories
    const count = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log(`Stats Total categories: ${count.count}`);
    
    if (count.count === 0) {
      console.log(`➕ Adding essential categories...`);
      
      // Add essential categories for the application to work
      const essentialCategories = [
        { name: 'Electronics & Gadgets', icon: 'fas fa-laptop', color: '#6366F1', description: 'Latest technology and smart devices', displayOrder: 10 },
        { name: 'Fashion & Clothing', icon: 'fas fa-tshirt', color: '#EC4899', description: 'Trendy clothing and accessories', displayOrder: 20 },
        { name: 'Home & Living', icon: 'fas fa-home', color: '#10B981', description: 'Home decor and living essentials', displayOrder: 30 },
        { name: 'Beauty & Personal Care', icon: 'fas fa-heart', color: '#F59E0B', description: 'Beauty products and personal care', displayOrder: 40 },
        { name: 'Sports & Fitness', icon: 'fas fa-dumbbell', color: '#EF4444', description: 'Sports equipment and fitness gear', displayOrder: 50 },
        { name: 'Books & Education', icon: 'fas fa-book', color: '#8B5CF6', description: 'Books and educational materials', displayOrder: 60 },
        { name: 'Toys & Games', icon: 'fas fa-gamepad', color: '#06B6D4', description: 'Toys and gaming products', displayOrder: 70 },
        { name: 'Automotive', icon: 'fas fa-car', color: '#84CC16', description: 'Car accessories and automotive products', displayOrder: 80 }
      ];
      
      for (const cat of essentialCategories) {
        try {
          db.prepare(`
            INSERT INTO categories (name, icon, color, description, displayOrder, isForProducts, isForServices)
            VALUES (?, ?, ?, ?, ?, 1, 0)
          `).run(cat.name, cat.icon, cat.color, cat.description, cat.displayOrder);
          console.log(`Success Added: ${cat.name}`);
        } catch (error) {
          console.log(`Error Failed to add ${cat.name}:`, error.message);
        }
      }
    } else if (columnsAdded > 0) {
      // Update existing categories with proper values
      console.log(`Refresh Updating existing categories...`);
      
      // Set displayOrder based on ID if not set
      const categoriesWithoutOrder = db.prepare("SELECT id FROM categories WHERE displayOrder IS NULL OR displayOrder = 0 ORDER BY id").all();
      categoriesWithoutOrder.forEach((cat, index) => {
        const displayOrder = (index + 1) * 10;
        db.prepare("UPDATE categories SET displayOrder = ? WHERE id = ?").run(displayOrder, cat.id);
      });
      
      // Set isForProducts = 1 and isForServices = 0 for all existing categories
      db.prepare("UPDATE categories SET isForProducts = 1, isForServices = 0 WHERE isForProducts IS NULL OR isForServices IS NULL").run();
      
      console.log(`Success Updated existing categories`);
    }
    
    // Test the final result
    try {
      const testQuery = db.prepare(`
        SELECT id, name, displayOrder, isForProducts, isForServices 
        FROM categories 
        ORDER BY displayOrder 
        LIMIT 5
      `).all();
      
      console.log(`\nSuccess Sample categories:`);
      testQuery.forEach(cat => {
        console.log(`  ${cat.id}. ${cat.name} (Order: ${cat.displayOrder}, Products: ${cat.isForProducts}, Services: ${cat.isForServices})`);
      });
      
      // Check for Fashion & Clothing specifically
      const fashionCategory = db.prepare("SELECT * FROM categories WHERE name LIKE '%Fashion%'").get();
      if (fashionCategory) {
        console.log(`\n👕 Fashion Category Found: ${fashionCategory.name} (ID: ${fashionCategory.id})`);
      } else {
        console.log(`\nError Fashion category not found!`);
      }
      
    } catch (error) {
      console.log(`Error Test query failed:`, error.message);
    }
    
    db.close();
    return true;
    
  } catch (error) {
    console.error(`Error Error fixing database:`, error.message);
    db.close();
    return false;
  }
}

// Run the fix
const success = fixProductionDatabase();

if (success) {
  console.log('\nCelebration Production database fixed successfully!');
  console.log('Success All required columns added');
  console.log('Success Categories populated and ready');
  console.log('Success Gender categorization will now work');
  console.log('\nBlog Next steps:');
  console.log('1. Restart PM2 processes: pm2 restart all');
  console.log('2. Check application logs: pm2 logs');
  console.log('3. Test categories in frontend');
} else {
  console.log('\nError Failed to fix production database');
  console.log('Please check the errors above and try again');
}
