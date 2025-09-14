const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔧 Final Categories Fix - Adding All 36 Categories...');

async function fixCategoriesFinal() {
  try {
    // Connect to database
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    console.log('Success Connected to database');

    // Check current state
    console.log('\nStats Current Database State');
    console.log('-'.repeat(50));
    
    const currentCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`Current categories: ${currentCount.count}`);

    // Check table structure
    const tableInfo = sqlite.prepare(`PRAGMA table_info(categories)`).all();
    console.log('Table columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    // Ensure table has all required columns
    console.log('\n🔧 Ensuring Table Structure');
    console.log('-'.repeat(50));
    
    const requiredColumns = [
      { name: 'display_order', type: 'INTEGER', default: '0' },
      { name: 'is_for_products', type: 'INTEGER', default: '1' },
      { name: 'is_for_services', type: 'INTEGER', default: '0' }
    ];

    requiredColumns.forEach(col => {
      const exists = tableInfo.find(c => c.name === col.name);
      if (!exists) {
        console.log(`Warning  Adding missing column: ${col.name}`);
        try {
          sqlite.prepare(`ALTER TABLE categories ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`).run();
          console.log(`Success Added ${col.name} column`);
        } catch (error) {
          console.log(`Warning  Column ${col.name} might already exist:`, error.message);
        }
      } else {
        console.log(`Success Column ${col.name} exists`);
      }
    });

    // Clear existing categories and add all 36
    console.log('\n🗑️  Clearing Existing Categories');
    console.log('-'.repeat(50));
    
    sqlite.prepare(`DELETE FROM categories`).run();
    console.log('Success Cleared existing categories');

    // Complete list of 36 categories with proper styling and icons
    console.log('\nBlog Adding All 36 Categories');
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

    console.log(`Inserting ${allCategories.length} categories...`);
    
    let insertedCount = 0;
    allCategories.forEach((cat, index) => {
      try {
        sqlite.prepare(`
          INSERT INTO categories (name, description, icon, color, is_for_products, is_for_services, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(cat.name, cat.description, cat.icon, cat.color, cat.isForProducts, cat.isForServices, cat.displayOrder);
        
        insertedCount++;
        console.log(`Success ${index + 1}. ${cat.name} (Order: ${cat.displayOrder})`);
      } catch (error) {
        console.log(`Error Error inserting category ${cat.name}:`, error.message);
      }
    });

    console.log(`\nStats Insertion Summary: ${insertedCount}/${allCategories.length} categories added`);

    // Verify final count
    const finalCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`\nSuccess Final category count: ${finalCount.count}`);

    // Display breakdown
    const productCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories WHERE is_for_products = 1`).get();
    const serviceCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories WHERE is_for_services = 1`).get();
    const mixedCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories WHERE is_for_products = 1 AND is_for_services = 1`).get();

    console.log(`\n📋 Category Breakdown:`);
    console.log(`   Product Categories: ${productCount.count}`);
    console.log(`   Service Categories: ${serviceCount.count}`);
    console.log(`   Mixed Categories: ${mixedCount.count}`);

    // Test API query to ensure it works
    console.log(`\n🧪 Testing API Query`);
    console.log('-'.repeat(50));
    
    try {
      const apiTest = sqlite.prepare(`
        SELECT id, name, description, icon, color, is_for_products, is_for_services, display_order
        FROM categories 
        ORDER BY display_order ASC, name ASC
      `).all();
      
      console.log(`Success API query successful: ${apiTest.length} categories returned`);
      
      if (apiTest.length > 0) {
        console.log('Sample categories:');
        apiTest.slice(0, 5).forEach((cat, index) => {
          const type = cat.is_for_products && cat.is_for_services ? 'Mixed' : 
                       cat.is_for_products ? 'Product' : 'Service';
          console.log(`   ${index + 1}. ${cat.name} (${type}) - ${cat.icon}`);
        });
        console.log(`   ... and ${apiTest.length - 5} more`);
      }
    } catch (error) {
      console.log(`Error API query failed:`, error.message);
    }

    sqlite.close();
    console.log('\nCelebration Categories successfully added to database!');
    
    return finalCount.count === 36;

  } catch (error) {
    console.error('Error Failed to add categories:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the fix
fixCategoriesFinal().then(success => {
  if (success) {
    console.log('\nSpecial SUCCESS! All 36 categories are now in the database!');
    console.log('\nBlog Next Steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Go to admin panel - you should see "Manage Categories (36)"');
    console.log('   3. Test category reordering with up/down arrows');
    console.log('   4. Browse categories should show all 36 items');
    console.log('   5. Test gender categorization in Fashion & Clothing');
  } else {
    console.log('\nError Category setup failed. Please check the errors above.');
    process.exit(1);
  }
});
