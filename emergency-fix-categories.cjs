const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('Alert EMERGENCY CATEGORIES FIX - Complete System Repair...');

async function emergencyFixCategories() {
  try {
    // Connect to database
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    console.log('Success Connected to database');
    console.log(`Database path: ${dbPath}`);

    // 1. Check if database file exists
    console.log('\nUpload 1. Database File Check');
    console.log('-'.repeat(50));
    
    const fs = require('fs');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`Success Database file exists (${stats.size} bytes)`);
    } else {
      console.log('Error Database file does not exist!');
      return false;
    }

    // 2. Check table structure
    console.log('\n🔧 2. Table Structure Check');
    console.log('-'.repeat(50));
    
    try {
      const tables = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
      console.log('Available tables:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });

      const categoriesTableExists = tables.some(table => table.name === 'categories');
      if (!categoriesTableExists) {
        console.log('Error Categories table does not exist! Creating...');
        
        // Create categories table
        sqlite.prepare(`
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            is_for_products INTEGER DEFAULT 1,
            is_for_services INTEGER DEFAULT 0,
            display_order INTEGER DEFAULT 0
          )
        `).run();
        
        console.log('Success Categories table created');
      } else {
        console.log('Success Categories table exists');
      }
    } catch (error) {
      console.log('Error Table check failed:', error.message);
    }

    // 3. Check current categories count
    console.log('\nStats 3. Current Categories Count');
    console.log('-'.repeat(50));
    
    let currentCount = 0;
    try {
      const countResult = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
      currentCount = countResult.count;
      console.log(`Current categories: ${currentCount}`);
    } catch (error) {
      console.log('Error Count query failed:', error.message);
      currentCount = 0;
    }

    // 4. Force recreate categories table and data
    console.log('\nRefresh 4. Force Recreate Categories');
    console.log('-'.repeat(50));
    
    try {
      // Drop and recreate table
      sqlite.prepare(`DROP TABLE IF EXISTS categories`).run();
      console.log('Success Dropped existing categories table');
      
      sqlite.prepare(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          is_for_products INTEGER DEFAULT 1,
          is_for_services INTEGER DEFAULT 0,
          display_order INTEGER DEFAULT 0
        )
      `).run();
      console.log('Success Created fresh categories table');
    } catch (error) {
      console.log('Error Table recreation failed:', error.message);
    }

    // 5. Insert all 36 categories with transaction
    console.log('\nBlog 5. Inserting All 36 Categories');
    console.log('-'.repeat(50));
    
    const allCategories = [
      // Product Categories (1-25)
      { name: 'Electronics & Gadgets', description: 'Latest technology and smart devices to enhance your life', icon: 'fas fa-laptop', color: '#6366F1', isForProducts: 1, isForServices: 0, displayOrder: 10 },
      { name: 'Fashion & Clothing', description: 'Trendy clothing and accessories to express your style', icon: 'fas fa-tshirt', color: '#EC4899', isForProducts: 1, isForServices: 0, displayOrder: 20 },
      { name: 'Home & Garden', description: 'Transform your space with home improvement and garden essentials', icon: 'fas fa-home', color: '#10B981', isForProducts: 1, isForServices: 0, displayOrder: 30 },
      { name: 'Health & Beauty', description: 'Premium health and beauty products for your wellness journey', icon: 'fas fa-heart', color: '#F59E0B', isForProducts: 1, isForServices: 0, displayOrder: 40 },
      { name: 'Sports & Fitness', description: 'Sports equipment and fitness gear to achieve your goals', icon: 'fas fa-dumbbell', color: '#EF4444', isForProducts: 1, isForServices: 0, displayOrder: 50 },
      { name: 'Books & Education', description: 'Educational materials and books for lifelong learning', icon: 'fas fa-book', color: '#8B5CF6', isForProducts: 1, isForServices: 0, displayOrder: 60 },
      { name: 'Toys & Games', description: 'Fun toys and engaging games for all ages', icon: 'fas fa-gamepad', color: '#06B6D4', isForProducts: 1, isForServices: 0, displayOrder: 70 },
      { name: 'Automotive', description: 'Car accessories and automotive essentials', icon: 'fas fa-car', color: '#84CC16', isForProducts: 1, isForServices: 0, displayOrder: 80 },
      { name: 'Baby & Kids', description: 'Safe and quality products for babies and children', icon: 'fas fa-baby', color: '#F97316', isForProducts: 1, isForServices: 0, displayOrder: 90 },
      { name: 'Pet Supplies', description: 'Everything your furry friends need for a happy life', icon: 'fas fa-paw', color: '#14B8A6', isForProducts: 1, isForServices: 0, displayOrder: 100 },
      { name: 'Food & Beverages', description: 'Delicious food products and kitchen essentials', icon: 'fas fa-utensils', color: '#C084FC', isForProducts: 1, isForServices: 0, displayOrder: 110 },
      { name: 'Jewelry & Watches', description: 'Elegant jewelry and timepieces for every occasion', icon: 'fas fa-gem', color: '#F472B6', isForProducts: 1, isForServices: 0, displayOrder: 120 },
      { name: 'Music & Instruments', description: 'Musical instruments and audio equipment for music lovers', icon: 'fas fa-music', color: '#A855F7', isForProducts: 1, isForServices: 0, displayOrder: 130 },
      { name: 'Office Supplies', description: 'Professional office supplies and stationery', icon: 'fas fa-briefcase', color: '#FB7185', isForProducts: 1, isForServices: 0, displayOrder: 140 },
      { name: 'Outdoor & Recreation', description: 'Outdoor gear for adventures and recreational activities', icon: 'fas fa-mountain', color: '#FBBF24', isForProducts: 1, isForServices: 0, displayOrder: 150 },
      { name: 'Arts & Crafts', description: 'Creative supplies for artistic expression and crafting', icon: 'fas fa-palette', color: '#34D399', isForProducts: 1, isForServices: 0, displayOrder: 160 },
      { name: 'Tools & Hardware', description: 'Quality tools and hardware for every project', icon: 'fas fa-tools', color: '#60A5FA', isForProducts: 1, isForServices: 0, displayOrder: 170 },
      { name: 'Photography', description: 'Cameras and photography equipment for capturing memories', icon: 'fas fa-camera', color: '#F87171', isForProducts: 1, isForServices: 0, displayOrder: 180 },
      { name: 'Kitchen & Dining', description: 'Kitchen appliances and dining accessories for culinary excellence', icon: 'fas fa-blender', color: '#A78BFA', isForProducts: 1, isForServices: 0, displayOrder: 190 },
      { name: 'Furniture', description: 'Stylish and functional furniture for home and office', icon: 'fas fa-couch', color: '#FB923C', isForProducts: 1, isForServices: 0, displayOrder: 200 },
      { name: 'Lighting', description: 'Illuminate your space with modern lighting solutions', icon: 'fas fa-lightbulb', color: '#FBBF24', isForProducts: 1, isForServices: 0, displayOrder: 210 },
      { name: 'Cleaning Supplies', description: 'Effective cleaning products for a spotless home', icon: 'fas fa-broom', color: '#22D3EE', isForProducts: 1, isForServices: 0, displayOrder: 220 },
      { name: 'Party Supplies', description: 'Everything you need for memorable celebrations', icon: 'fas fa-birthday-cake', color: '#F472B6', isForProducts: 1, isForServices: 0, displayOrder: 230 },
      { name: 'Collectibles', description: 'Rare and valuable collectible items for enthusiasts', icon: 'fas fa-trophy', color: '#FBBF24', isForProducts: 1, isForServices: 0, displayOrder: 240 },
      { name: 'Industrial & Scientific', description: 'Professional industrial and scientific equipment', icon: 'fas fa-flask', color: '#6B7280', isForProducts: 1, isForServices: 0, displayOrder: 250 },

      // Service Categories (26-35)
      { name: 'Digital Services', description: 'Apps, software and digital tools for productivity', icon: 'fas fa-cloud', color: '#6366F1', isForProducts: 0, isForServices: 1, displayOrder: 260 },
      { name: 'Streaming Services', description: 'Entertainment streaming platforms for movies and music', icon: 'fas fa-play', color: '#22C55E', isForProducts: 0, isForServices: 1, displayOrder: 270 },
      { name: 'Financial Services', description: 'Banking, investment and financial management tools', icon: 'fas fa-coins', color: '#F59E0B', isForProducts: 0, isForServices: 1, displayOrder: 280 },
      { name: 'Educational Services', description: 'Online courses and learning platforms for skill development', icon: 'fas fa-graduation-cap', color: '#A855F7', isForProducts: 0, isForServices: 1, displayOrder: 290 },
      { name: 'Business Tools', description: 'Professional software and tools for business growth', icon: 'fas fa-chart-line', color: '#EF4444', isForProducts: 0, isForServices: 1, displayOrder: 300 },
      { name: 'Communication Tools', description: 'Messaging and communication platforms for connectivity', icon: 'fas fa-comments', color: '#06B6D4', isForProducts: 0, isForServices: 1, displayOrder: 310 },
      { name: 'Design Services', description: 'Creative design tools and graphic design platforms', icon: 'fas fa-paint-brush', color: '#EC4899', isForProducts: 0, isForServices: 1, displayOrder: 320 },
      { name: 'Marketing Services', description: 'Digital marketing and advertising tools for business', icon: 'fas fa-bullhorn', color: '#F97316', isForProducts: 0, isForServices: 1, displayOrder: 330 },
      { name: 'Security Services', description: 'Cybersecurity and protection services for digital safety', icon: 'fas fa-shield-alt', color: '#DC2626', isForProducts: 0, isForServices: 1, displayOrder: 340 },
      { name: 'Cloud Storage', description: 'Secure cloud storage and backup solutions', icon: 'fas fa-cloud-upload-alt', color: '#3B82F6', isForProducts: 0, isForServices: 1, displayOrder: 350 },

      // Mixed Categories (36)
      { name: 'Travel & Lifestyle', description: 'Travel gear, lifestyle products and travel services', icon: 'fas fa-suitcase', color: '#10B981', isForProducts: 1, isForServices: 1, displayOrder: 360 }
    ];

    // Use transaction for better reliability
    const insertStmt = sqlite.prepare(`
      INSERT INTO categories (name, description, icon, color, is_for_products, is_for_services, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = sqlite.transaction((categories) => {
      for (const cat of categories) {
        insertStmt.run(cat.name, cat.description, cat.icon, cat.color, cat.isForProducts, cat.isForServices, cat.displayOrder);
      }
    });

    try {
      insertMany(allCategories);
      console.log(`Success Successfully inserted all ${allCategories.length} categories using transaction`);
    } catch (error) {
      console.log('Error Transaction failed:', error.message);
      
      // Fallback: insert one by one
      console.log('Refresh Trying individual inserts...');
      let insertedCount = 0;
      allCategories.forEach((cat, index) => {
        try {
          sqlite.prepare(`
            INSERT INTO categories (name, description, icon, color, is_for_products, is_for_services, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(cat.name, cat.description, cat.icon, cat.color, cat.isForProducts, cat.isForServices, cat.displayOrder);
          insertedCount++;
        } catch (insertError) {
          console.log(`Error Failed to insert ${cat.name}:`, insertError.message);
        }
      });
      console.log(`Success Inserted ${insertedCount}/${allCategories.length} categories individually`);
    }

    // 6. Verify final count
    console.log('\nStats 6. Final Verification');
    console.log('-'.repeat(50));
    
    const finalCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`Final category count: ${finalCount.count}`);

    // 7. Test all API queries
    console.log('\n🧪 7. API Query Testing');
    console.log('-'.repeat(50));
    
    // Test main categories query
    try {
      const mainQuery = sqlite.prepare(`
        SELECT id, name, description, icon, color, is_for_products, is_for_services, display_order
        FROM categories 
        ORDER BY display_order ASC, name ASC
      `).all();
      console.log(`Success Main categories query: ${mainQuery.length} results`);
    } catch (error) {
      console.log('Error Main categories query failed:', error.message);
    }

    // Test product categories query
    try {
      const productQuery = sqlite.prepare(`
        SELECT id, name, description, icon, color, display_order
        FROM categories 
        WHERE is_for_products = 1
        ORDER BY display_order ASC, name ASC
      `).all();
      console.log(`Success Product categories query: ${productQuery.length} results`);
    } catch (error) {
      console.log('Error Product categories query failed:', error.message);
    }

    // Test service categories query
    try {
      const serviceQuery = sqlite.prepare(`
        SELECT id, name, description, icon, color, display_order
        FROM categories 
        WHERE is_for_services = 1
        ORDER BY display_order ASC, name ASC
      `).all();
      console.log(`Success Service categories query: ${serviceQuery.length} results`);
    } catch (error) {
      console.log('Error Service categories query failed:', error.message);
    }

    // 8. Show sample data
    console.log('\n📋 8. Sample Categories Data');
    console.log('-'.repeat(50));
    
    const sampleData = sqlite.prepare(`
      SELECT id, name, icon, color, display_order, is_for_products, is_for_services
      FROM categories 
      ORDER BY display_order ASC 
      LIMIT 10
    `).all();
    
    console.log('First 10 categories:');
    sampleData.forEach((cat, index) => {
      const type = cat.is_for_products && cat.is_for_services ? 'Mixed' : 
                   cat.is_for_products ? 'Product' : 'Service';
      console.log(`   ${index + 1}. ${cat.name} (${type}) - ${cat.icon} - Order: ${cat.display_order}`);
    });

    sqlite.close();
    
    const success = finalCount.count === 36;
    console.log(`\n${success ? 'Celebration' : 'Error'} Emergency fix ${success ? 'SUCCESSFUL' : 'FAILED'}`);
    
    return success;

  } catch (error) {
    console.error('Error Emergency fix failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the emergency fix
emergencyFixCategories().then(success => {
  if (success) {
    console.log('\nLaunch EMERGENCY FIX COMPLETE!');
    console.log('\nSpecial All 36 categories are now properly installed in the database!');
    console.log('\nBlog IMMEDIATE NEXT STEPS:');
    console.log('   1. Refresh RESTART your development server NOW');
    console.log('   2. Global Go to admin panel categories section');
    console.log('   3. Success You should see "Manage Categories (36)"');
    console.log('   4. Target Browse categories should show all 36 items');
    console.log('   5. 👔 Test Fashion & Clothing for gender categorization');
    console.log('\nWarning  IMPORTANT: You MUST restart the server for changes to take effect!');
  } else {
    console.log('\n💥 EMERGENCY FIX FAILED!');
    console.log('Please check the errors above and try running the script again.');
    process.exit(1);
  }
});
