const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Fixing Production Server Database...\n');

function fixProductionDatabase() {
  // The production server is using sqlite.db
  const dbFile = 'sqlite.db';
  
  if (!fs.existsSync(dbFile)) {
    console.log('Error sqlite.db not found! Creating new database...');
    // Create the database file
    const db = new Database(dbFile);
    db.close();
  }

  console.log(`Upload Working with production database: ${dbFile}`);
  
  try {
    const db = new Database(dbFile);
    
    console.log('Search Checking current production database schema...');
    
    // Check if categories table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📋 Current tables: ${tables.map(t => t.name).join(', ')}`);
    
    const categoriesExists = tables.find(t => t.name === 'categories');
    
    if (!categoriesExists) {
      console.log('Error Categories table missing! Creating...');
      
      // Create categories table with correct schema
      db.prepare(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          description TEXT NOT NULL,
          is_for_products INTEGER DEFAULT 1,
          is_for_services INTEGER DEFAULT 0,
          display_order INTEGER DEFAULT 0
        )
      `).run();
      
      console.log('Success Categories table created');
      
      // Insert essential categories
      const categories = [
        { name: 'Electronics & Gadgets', icon: 'fas fa-laptop', color: '#6366F1', description: 'Latest technology and smart devices', display_order: 10 },
        { name: 'Fashion & Clothing', icon: 'fas fa-tshirt', color: '#EC4899', description: 'Trendy clothing and accessories', display_order: 20 },
        { name: 'Home & Living', icon: 'fas fa-home', color: '#10B981', description: 'Home decor and living essentials', display_order: 30 },
        { name: 'Beauty & Personal Care', icon: 'fas fa-heart', color: '#F59E0B', description: 'Beauty products and personal care', display_order: 40 },
        { name: 'Sports & Fitness', icon: 'fas fa-dumbbell', color: '#EF4444', description: 'Sports equipment and fitness gear', display_order: 50 },
        { name: 'Books & Education', icon: 'fas fa-book', color: '#8B5CF6', description: 'Books and educational materials', display_order: 60 },
        { name: 'Toys & Games', icon: 'fas fa-gamepad', color: '#06B6D4', description: 'Toys and gaming products', display_order: 70 },
        { name: 'Automotive', icon: 'fas fa-car', color: '#84CC16', description: 'Car accessories and automotive products', display_order: 80 }
      ];
      
      for (const cat of categories) {
        db.prepare(`
          INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services)
          VALUES (?, ?, ?, ?, ?, 1, 0)
        `).run(cat.name, cat.icon, cat.color, cat.description, cat.display_order);
      }
      
      console.log(`Success Added ${categories.length} essential categories`);
      
    } else {
      console.log('Success Categories table exists');
      
      // Check if required columns exist
      const columns = db.prepare("PRAGMA table_info(categories)").all();
      const columnNames = columns.map(col => col.name);
      
      console.log(`📋 Current columns: ${columnNames.join(', ')}`);
      
      // Add missing columns
      const requiredColumns = [
        { name: 'is_for_products', type: 'INTEGER DEFAULT 1' },
        { name: 'is_for_services', type: 'INTEGER DEFAULT 0' },
        { name: 'display_order', type: 'INTEGER DEFAULT 0' }
      ];
      
      for (const col of requiredColumns) {
        if (!columnNames.includes(col.name)) {
          console.log(`➕ Adding missing column: ${col.name}`);
          try {
            db.prepare(`ALTER TABLE categories ADD COLUMN ${col.name} ${col.type}`).run();
            console.log(`Success Added ${col.name} column`);
          } catch (error) {
            if (!error.message.includes('duplicate column')) {
              console.log(`Error Failed to add ${col.name}: ${error.message}`);
            }
          }
        }
      }
      
      // Check if we have categories
      const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get();
      console.log(`Stats Categories in database: ${categoryCount.count}`);
      
      if (categoryCount.count === 0) {
        console.log('➕ Adding essential categories...');
        
        const categories = [
          { name: 'Electronics & Gadgets', icon: 'fas fa-laptop', color: '#6366F1', description: 'Latest technology and smart devices', display_order: 10 },
          { name: 'Fashion & Clothing', icon: 'fas fa-tshirt', color: '#EC4899', description: 'Trendy clothing and accessories', display_order: 20 },
          { name: 'Home & Living', icon: 'fas fa-home', color: '#10B981', description: 'Home decor and living essentials', display_order: 30 },
          { name: 'Beauty & Personal Care', icon: 'fas fa-heart', color: '#F59E0B', description: 'Beauty products and personal care', display_order: 40 },
          { name: 'Sports & Fitness', icon: 'fas fa-dumbbell', color: '#EF4444', description: 'Sports equipment and fitness gear', display_order: 50 },
          { name: 'Books & Education', icon: 'fas fa-book', color: '#8B5CF6', description: 'Books and educational materials', display_order: 60 },
          { name: 'Toys & Games', icon: 'fas fa-gamepad', color: '#06B6D4', description: 'Toys and gaming products', display_order: 70 },
          { name: 'Automotive', icon: 'fas fa-car', color: '#84CC16', description: 'Car accessories and automotive products', display_order: 80 }
        ];
        
        for (const cat of categories) {
          try {
            db.prepare(`
              INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services)
              VALUES (?, ?, ?, ?, ?, 1, 0)
            `).run(cat.name, cat.icon, cat.color, cat.description, cat.display_order);
            console.log(`Success Added: ${cat.name}`);
          } catch (error) {
            console.log(`Error Failed to add ${cat.name}: ${error.message}`);
          }
        }
      }
    }
    
    // Test the categories query that was failing
    console.log('\n🧪 Testing production queries...');
    
    try {
      const categoriesTest = db.prepare(`
        SELECT id, name, icon, color, description, 
               is_for_products, is_for_services, display_order 
        FROM categories 
        ORDER BY display_order
      `).all();
      
      console.log(`Success Categories query works: ${categoriesTest.length} categories found`);
      
      // Check for Fashion category specifically
      const fashionCategory = categoriesTest.find(cat => cat.name.includes('Fashion'));
      if (fashionCategory) {
        console.log(`👕 Fashion category: ${fashionCategory.name} (ID: ${fashionCategory.id})`);
      }
      
    } catch (queryError) {
      console.log(`Error Query test failed: ${queryError.message}`);
    }
    
    // Check products table
    const productsExists = tables.find(t => t.name === 'products');
    if (productsExists) {
      console.log('\nSearch Checking products table...');
      const productColumns = db.prepare("PRAGMA table_info(products)").all();
      console.log(`📋 Products table has ${productColumns.length} columns`);
      
      // Check for fashion products
      const fashionProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE category LIKE '%Fashion%'").get();
      console.log(`👔 Fashion products: ${fashionProducts.count}`);
    }
    
    db.close();
    
    console.log('\nCelebration Production database fix completed!');
    return true;
    
  } catch (error) {
    console.log(`Error Production database fix failed: ${error.message}`);
    return false;
  }
}

// Run the production fix
const success = fixProductionDatabase();

if (success) {
  console.log('\nBlog Next steps for production server:');
  console.log('1. Upload this script to your EC2 server');
  console.log('2. Run: node fix-production-server-database.cjs');
  console.log('3. Restart PM2: pm2 restart all');
  console.log('4. Check logs: pm2 logs');
  console.log('\nSuccess The SQLite errors should be resolved!');
} else {
  console.log('\nError Fix failed. Check the error messages above.');
}
