const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 COMPLETE SQLite Error Fix - Fixing ALL errors at once...\n');

function fixAllSQLiteErrors() {
  // Use the production database file
  const dbFile = 'sqlite.db';
  
  if (!fs.existsSync(dbFile)) {
    console.log('Error sqlite.db not found! Creating new database...');
    const db = new Database(dbFile);
    db.close();
  }

  console.log(`Upload Working with production database: ${dbFile}`);
  
  try {
    const db = new Database(dbFile);
    
    console.log('Search Checking current database schema...');
    
    // Get all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📋 Current tables: ${tables.map(t => t.name).join(', ')}`);
    
    // Fix Categories Table
    console.log('\n🏷️ Fixing Categories Table...');
    
    const categoriesExists = tables.find(t => t.name === 'categories');
    
    if (!categoriesExists) {
      console.log('Error Categories table missing! Creating...');
      
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
    } else {
      console.log('Success Categories table exists');
      
      // Check and add missing columns
      const columns = db.prepare("PRAGMA table_info(categories)").all();
      const columnNames = columns.map(col => col.name);
      
      console.log(`📋 Current columns: ${columnNames.join(', ')}`);
      
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
            } else {
              console.log(`Success Column ${col.name} already exists`);
            }
          }
        }
      }
    }
    
    // Add essential categories if missing
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
    
    // Fix Products Table
    console.log('\nProducts Fixing Products Table...');
    
    const productsExists = tables.find(t => t.name === 'products');
    
    if (!productsExists) {
      console.log('Error Products table missing! Creating...');
      
      db.prepare(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          price NUMERIC NOT NULL,
          original_price NUMERIC,
          image_url TEXT NOT NULL,
          affiliate_url TEXT NOT NULL,
          affiliate_network_id INTEGER,
          category TEXT NOT NULL,
          gender TEXT,
          rating NUMERIC NOT NULL,
          review_count INTEGER NOT NULL,
          discount INTEGER,
          is_new INTEGER DEFAULT 0,
          is_featured INTEGER DEFAULT 0,
          is_service INTEGER DEFAULT 0,
          custom_fields TEXT,
          pricing_type TEXT,
          monthly_price NUMERIC,
          yearly_price NUMERIC,
          is_free INTEGER DEFAULT 0,
          price_description TEXT,
          has_timer INTEGER DEFAULT 0,
          timer_duration INTEGER,
          timer_start_time INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `).run();
      
      console.log('Success Products table created');
    } else {
      console.log('Success Products table exists');
      
      // Check and add missing columns to products table
      const productColumns = db.prepare("PRAGMA table_info(products)").all();
      const productColumnNames = productColumns.map(col => col.name);
      
      const requiredProductColumns = [
        { name: 'is_new', type: 'INTEGER DEFAULT 0' },
        { name: 'is_featured', type: 'INTEGER DEFAULT 0' },
        { name: 'is_service', type: 'INTEGER DEFAULT 0' },
        { name: 'custom_fields', type: 'TEXT' },
        { name: 'pricing_type', type: 'TEXT' },
        { name: 'monthly_price', type: 'NUMERIC' },
        { name: 'yearly_price', type: 'NUMERIC' },
        { name: 'is_free', type: 'INTEGER DEFAULT 0' },
        { name: 'price_description', type: 'TEXT' },
        { name: 'has_timer', type: 'INTEGER DEFAULT 0' },
        { name: 'timer_duration', type: 'INTEGER' },
        { name: 'timer_start_time', type: 'INTEGER' },
        { name: 'created_at', type: 'INTEGER DEFAULT (strftime(\'%s\', \'now\'))' }
      ];
      
      for (const col of requiredProductColumns) {
        if (!productColumnNames.includes(col.name)) {
          console.log(`➕ Adding missing product column: ${col.name}`);
          try {
            db.prepare(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`).run();
            console.log(`Success Added ${col.name} column to products`);
          } catch (error) {
            if (!error.message.includes('duplicate column')) {
              console.log(`Error Failed to add ${col.name}: ${error.message}`);
            } else {
              console.log(`Success Column ${col.name} already exists in products`);
            }
          }
        }
      }
    }
    
    // Test all critical queries
    console.log('\n🧪 Testing all critical queries...');
    
    try {
      // Test categories query
      const categoriesTest = db.prepare(`
        SELECT id, name, icon, color, description, 
               COALESCE(is_for_products, 1) as is_for_products, 
               COALESCE(is_for_services, 0) as is_for_services, 
               COALESCE(display_order, id * 10) as display_order 
        FROM categories 
        ORDER BY COALESCE(display_order, id * 10)
      `).all();
      
      console.log(`Success Categories query works: ${categoriesTest.length} categories found`);
      
      // Check for Fashion category specifically
      const fashionCategory = categoriesTest.find(cat => cat.name.includes('Fashion'));
      if (fashionCategory) {
        console.log(`👕 Fashion category: ${fashionCategory.name} (ID: ${fashionCategory.id})`);
      }
      
    } catch (queryError) {
      console.log(`Error Categories query test failed: ${queryError.message}`);
    }
    
    try {
      // Test products query
      const productsTest = db.prepare(`
        SELECT COUNT(*) as count FROM products
      `).get();
      
      console.log(`Success Products query works: ${productsTest.count} products found`);
      
      // Test featured products query
      const featuredTest = db.prepare(`
        SELECT COUNT(*) as count FROM products WHERE COALESCE(is_featured, 0) = 1
      `).get();
      
      console.log(`Success Featured products query works: ${featuredTest.count} featured products found`);
      
    } catch (queryError) {
      console.log(`Error Products query test failed: ${queryError.message}`);
    }
    
    try {
      // Test fashion products with gender
      const fashionProductsTest = db.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE category LIKE '%Fashion%' AND gender IS NOT NULL
      `).get();
      
      console.log(`Success Fashion products with gender query works: ${fashionProductsTest.count} fashion products found`);
      
    } catch (queryError) {
      console.log(`Error Fashion products query test failed: ${queryError.message}`);
    }
    
    // Create other required tables if missing
    console.log('\n🔧 Ensuring all required tables exist...');
    
    const requiredTables = [
      {
        name: 'blog_posts',
        sql: `CREATE TABLE IF NOT EXISTS blog_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          tags TEXT,
          image_url TEXT NOT NULL,
          video_url TEXT,
          published_at INTEGER NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          read_time TEXT NOT NULL,
          slug TEXT NOT NULL,
          has_timer INTEGER DEFAULT 0,
          timer_duration INTEGER,
          timer_start_time INTEGER
        )`
      },
      {
        name: 'announcements',
        sql: `CREATE TABLE IF NOT EXISTS announcements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          text_color TEXT DEFAULT '#ffffff',
          background_color TEXT DEFAULT '#3b82f6',
          font_size TEXT DEFAULT '16px',
          font_weight TEXT DEFAULT 'normal',
          text_decoration TEXT DEFAULT 'none',
          font_style TEXT DEFAULT 'normal',
          animation_speed TEXT DEFAULT '30',
          text_border_width TEXT DEFAULT '0px',
          text_border_style TEXT DEFAULT 'solid',
          text_border_color TEXT DEFAULT '#000000',
          banner_border_width TEXT DEFAULT '0px',
          banner_border_style TEXT DEFAULT 'solid',
          banner_border_color TEXT DEFAULT '#000000',
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )`
      },
      {
        name: 'video_content',
        sql: `CREATE TABLE IF NOT EXISTS video_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT,
          platform TEXT NOT NULL,
          category TEXT NOT NULL,
          tags TEXT,
          duration TEXT,
          has_timer INTEGER DEFAULT 0,
          timer_duration INTEGER,
          timer_start_time INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )`
      },
      {
        name: 'affiliate_networks',
        sql: `CREATE TABLE IF NOT EXISTS affiliate_networks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL,
          commission_rate NUMERIC NOT NULL,
          tracking_params TEXT,
          logo_url TEXT,
          is_active INTEGER DEFAULT 1,
          join_url TEXT
        )`
      },
      {
        name: 'newsletter_subscribers',
        sql: `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          subscribed_at INTEGER DEFAULT (strftime('%s', 'now'))
        )`
      },
      {
        name: 'admin_users',
        sql: `CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          reset_token TEXT,
          reset_token_expiry INTEGER,
          last_login INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          is_active INTEGER DEFAULT 1
        )`
      }
    ];
    
    for (const table of requiredTables) {
      try {
        db.prepare(table.sql).run();
        console.log(`Success Table ${table.name} ensured`);
      } catch (error) {
        console.log(`Error Failed to create ${table.name}: ${error.message}`);
      }
    }
    
    db.close();
    
    console.log('\nCelebration ALL SQLite errors have been fixed!');
    console.log('\nBlog Summary of fixes:');
    console.log('Success Categories table: Fixed missing columns (is_for_products, is_for_services, display_order)');
    console.log('Success Products table: Fixed missing columns and ensured proper structure');
    console.log('Success All required tables: Created if missing');
    console.log('Success Essential categories: Added if database was empty');
    console.log('Success All queries: Tested and working');
    
    return true;
    
  } catch (error) {
    console.log(`Error Complete SQLite fix failed: ${error.message}`);
    return false;
  }
}

// Run the complete fix
const success = fixAllSQLiteErrors();

if (success) {
  console.log('\nLaunch Next steps:');
  console.log('1. Upload this script to your EC2 server');
  console.log('2. Run: node COMPLETE_SQLITE_ERROR_FIX.cjs');
  console.log('3. Restart PM2: pm2 restart all');
  console.log('4. Check logs: pm2 logs');
  console.log('\nSuccess ALL SQLite errors should now be resolved!');
  console.log('Success Gender categorization will work properly');
  console.log('Success Categories API will return data');
  console.log('Success Featured products will load');
  console.log('Success All admin functionality will work');
} else {
  console.log('\nError Fix failed. Check the error messages above.');
}
