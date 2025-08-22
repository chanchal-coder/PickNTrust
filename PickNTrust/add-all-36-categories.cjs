const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('📋 Adding All 36 Categories for Complete Admin Management...');

async function addAll36Categories() {
  try {
    // Connect to database
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    console.log('✅ Connected to database');

    // Check current categories count
    const currentCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`Current categories: ${currentCount.count}`);

    // Complete list of 36 categories
    const allCategories = [
      // Product Categories (1-25)
      { name: 'Electronics & Gadgets', description: 'Latest technology and smart devices', icon: 'fas fa-laptop', color: '#6366F1', isForProducts: 1, isForServices: 0, displayOrder: 10 },
      { name: 'Fashion & Clothing', description: 'Trendy clothing and accessories', icon: 'fas fa-tshirt', color: '#EC4899', isForProducts: 1, isForServices: 0, displayOrder: 20 },
      { name: 'Home & Garden', description: 'Home improvement and garden items', icon: 'fas fa-home', color: '#10B981', isForProducts: 1, isForServices: 0, displayOrder: 30 },
      { name: 'Health & Beauty', description: 'Health and beauty products', icon: 'fas fa-heart', color: '#F59E0B', isForProducts: 1, isForServices: 0, displayOrder: 40 },
      { name: 'Sports & Fitness', description: 'Sports and fitness equipment', icon: 'fas fa-dumbbell', color: '#EF4444', isForProducts: 1, isForServices: 0, displayOrder: 50 },
      { name: 'Books & Education', description: 'Books and educational materials', icon: 'fas fa-book', color: '#8B5CF6', isForProducts: 1, isForServices: 0, displayOrder: 60 },
      { name: 'Toys & Games', description: 'Toys and gaming products', icon: 'fas fa-gamepad', color: '#06B6D4', isForProducts: 1, isForServices: 0, displayOrder: 70 },
      { name: 'Automotive', description: 'Car accessories and automotive products', icon: 'fas fa-car', color: '#84CC16', isForProducts: 1, isForServices: 0, displayOrder: 80 },
      { name: 'Baby & Kids', description: 'Baby and children products', icon: 'fas fa-baby', color: '#F97316', isForProducts: 1, isForServices: 0, displayOrder: 90 },
      { name: 'Pet Supplies', description: 'Pet care and accessories', icon: 'fas fa-paw', color: '#14B8A6', isForProducts: 1, isForServices: 0, displayOrder: 100 },
      { name: 'Food & Beverages', description: 'Food products and kitchen accessories', icon: 'fas fa-utensils', color: '#C084FC', isForProducts: 1, isForServices: 0, displayOrder: 110 },
      { name: 'Jewelry & Watches', description: 'Jewelry, watches and accessories', icon: 'fas fa-gem', color: '#F472B6', isForProducts: 1, isForServices: 0, displayOrder: 120 },
      { name: 'Music & Instruments', description: 'Musical instruments and audio equipment', icon: 'fas fa-music', color: '#A855F7', isForProducts: 1, isForServices: 0, displayOrder: 130 },
      { name: 'Office Supplies', description: 'Office and stationery products', icon: 'fas fa-briefcase', color: '#FB7185', isForProducts: 1, isForServices: 0, displayOrder: 140 },
      { name: 'Outdoor & Recreation', description: 'Outdoor gear and recreational equipment', icon: 'fas fa-mountain', color: '#FBBF24', isForProducts: 1, isForServices: 0, displayOrder: 150 },
      { name: 'Arts & Crafts', description: 'Art supplies and craft materials', icon: 'fas fa-palette', color: '#34D399', isForProducts: 1, isForServices: 0, displayOrder: 160 },
      { name: 'Tools & Hardware', description: 'Tools and hardware equipment', icon: 'fas fa-tools', color: '#60A5FA', isForProducts: 1, isForServices: 0, displayOrder: 170 },
      { name: 'Photography', description: 'Cameras and photography equipment', icon: 'fas fa-camera', color: '#F87171', isForProducts: 1, isForServices: 0, displayOrder: 180 },
      { name: 'Kitchen & Dining', description: 'Kitchen appliances and dining accessories', icon: 'fas fa-blender', color: '#A78BFA', isForProducts: 1, isForServices: 0, displayOrder: 190 },
      { name: 'Furniture', description: 'Home and office furniture', icon: 'fas fa-couch', color: '#FB923C', isForProducts: 1, isForServices: 0, displayOrder: 200 },
      { name: 'Lighting', description: 'Indoor and outdoor lighting solutions', icon: 'fas fa-lightbulb', color: '#FBBF24', isForProducts: 1, isForServices: 0, displayOrder: 210 },
      { name: 'Cleaning Supplies', description: 'Household cleaning products', icon: 'fas fa-broom', color: '#22D3EE', isForProducts: 1, isForServices: 0, displayOrder: 220 },
      { name: 'Party Supplies', description: 'Party decorations and supplies', icon: 'fas fa-birthday-cake', color: '#F472B6', isForProducts: 1, isForServices: 0, displayOrder: 230 },
      { name: 'Collectibles', description: 'Collectible items and memorabilia', icon: 'fas fa-trophy', color: '#FBBF24', isForProducts: 1, isForServices: 0, displayOrder: 240 },
      { name: 'Industrial & Scientific', description: 'Industrial and scientific equipment', icon: 'fas fa-flask', color: '#6B7280', isForProducts: 1, isForServices: 0, displayOrder: 250 },

      // Service Categories (26-35)
      { name: 'Digital Services', description: 'Apps, software and digital tools', icon: 'fas fa-cloud', color: '#6366F1', isForProducts: 0, isForServices: 1, displayOrder: 260 },
      { name: 'Streaming Services', description: 'Video and music streaming platforms', icon: 'fas fa-play', color: '#22C55E', isForProducts: 0, isForServices: 1, displayOrder: 270 },
      { name: 'Financial Services', description: 'Banking and financial tools', icon: 'fas fa-coins', color: '#F59E0B', isForProducts: 0, isForServices: 1, displayOrder: 280 },
      { name: 'Educational Services', description: 'Online courses and learning platforms', icon: 'fas fa-graduation-cap', color: '#A855F7', isForProducts: 0, isForServices: 1, displayOrder: 290 },
      { name: 'Business Tools', description: 'Productivity and business software', icon: 'fas fa-chart-line', color: '#EF4444', isForProducts: 0, isForServices: 1, displayOrder: 300 },
      { name: 'Communication Tools', description: 'Messaging and communication platforms', icon: 'fas fa-comments', color: '#06B6D4', isForProducts: 0, isForServices: 1, displayOrder: 310 },
      { name: 'Design Services', description: 'Graphic design and creative tools', icon: 'fas fa-paint-brush', color: '#EC4899', isForProducts: 0, isForServices: 1, displayOrder: 320 },
      { name: 'Marketing Services', description: 'Marketing and advertising tools', icon: 'fas fa-bullhorn', color: '#F97316', isForProducts: 0, isForServices: 1, displayOrder: 330 },
      { name: 'Security Services', description: 'Cybersecurity and protection tools', icon: 'fas fa-shield-alt', color: '#DC2626', isForProducts: 0, isForServices: 1, displayOrder: 340 },
      { name: 'Cloud Storage', description: 'Cloud storage and backup services', icon: 'fas fa-cloud-upload-alt', color: '#3B82F6', isForProducts: 0, isForServices: 1, displayOrder: 350 },

      // Mixed Categories (36)
      { name: 'Travel & Lifestyle', description: 'Travel gear and lifestyle products/services', icon: 'fas fa-suitcase', color: '#10B981', isForProducts: 1, isForServices: 1, displayOrder: 360 }
    ];

    console.log(`\n📊 Target: ${allCategories.length} categories`);

    // Clear existing categories and insert all 36
    console.log('🔄 Clearing existing categories...');
    sqlite.prepare(`DELETE FROM categories`).run();

    console.log('📝 Inserting all 36 categories...');
    
    let insertedCount = 0;
    allCategories.forEach((cat, index) => {
      try {
        sqlite.prepare(`
          INSERT INTO categories (name, description, icon, color, is_for_products, is_for_services, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(cat.name, cat.description, cat.icon, cat.color, cat.isForProducts, cat.isForServices, cat.displayOrder);
        insertedCount++;
      } catch (error) {
        console.log(`⚠️  Error inserting category ${cat.name}:`, error.message);
      }
    });

    console.log(`✅ Successfully inserted ${insertedCount} categories`);

    // Verify final count
    const finalCount = sqlite.prepare(`SELECT COUNT(*) as count FROM categories`).get();
    console.log(`\n📊 Final category count: ${finalCount.count}`);

    // Display categories by type
    const productCategories = sqlite.prepare(`SELECT COUNT(*) as count FROM categories WHERE is_for_products = 1`).get();
    const serviceCategories = sqlite.prepare(`SELECT COUNT(*) as count FROM categories WHERE is_for_services = 1`).get();
    const mixedCategories = sqlite.prepare(`SELECT COUNT(*) as count FROM categories WHERE is_for_products = 1 AND is_for_services = 1`).get();

    console.log(`\n📋 Category Breakdown:`);
    console.log(`   Product Categories: ${productCategories.count}`);
    console.log(`   Service Categories: ${serviceCategories.count}`);
    console.log(`   Mixed Categories: ${mixedCategories.count}`);

    // Show all categories in order
    console.log(`\n📝 All Categories (Display Order):`);
    const allCats = sqlite.prepare(`
      SELECT id, name, is_for_products, is_for_services, display_order
      FROM categories 
      ORDER BY display_order ASC
    `).all();

    allCats.forEach((cat, index) => {
      const type = cat.is_for_products && cat.is_for_services ? 'Mixed' : 
                   cat.is_for_products ? 'Product' : 'Service';
      console.log(`   ${index + 1}. ${cat.name} (${type}) - Order: ${cat.display_order}`);
    });

    sqlite.close();
    console.log('\n🎉 All 36 categories successfully added!');
    
    return true;

  } catch (error) {
    console.error('❌ Failed to add categories:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the script
addAll36Categories().then(success => {
  if (success) {
    console.log('\n✨ Complete category system ready!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Check admin panel - all 36 categories should be visible');
    console.log('   3. Test category reordering functionality');
    console.log('   4. Verify browse categories displays all items');
  } else {
    console.log('\n❌ Category setup failed. Please check the errors above.');
    process.exit(1);
  }
});
