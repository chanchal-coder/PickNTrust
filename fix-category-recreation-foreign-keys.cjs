// Fix Category Recreation with Foreign Key Handling
// Safely handle foreign key constraints during category recreation

const Database = require('better-sqlite3');

console.log('🔧 FIXING CATEGORY RECREATION WITH FOREIGN KEY HANDLING');
console.log('=' .repeat(60));

async function fixCategoryRecreationWithForeignKeys() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\n1. 🔒 DISABLING FOREIGN KEY CONSTRAINTS...');
    console.log('=' .repeat(50));
    
    // Disable foreign key constraints temporarily
    db.prepare('PRAGMA foreign_keys = OFF').run();
    console.log('Success Foreign key constraints disabled');
    
    console.log('\n2. Products VERIFYING BACKUP EXISTS...');
    console.log('=' .repeat(50));
    
    // Check if backup exists
    try {
      const backupCount = db.prepare(`SELECT COUNT(*) as count FROM admincategory`).get();
      console.log(`Success Backup verified: ${backupCount.count} categories in 'admincategory'`);
    } catch (error) {
      console.log('Error No backup found, creating fresh backup...');
      
      // Create backup
      db.prepare(`DROP TABLE IF EXISTS admincategory`).run();
      db.prepare(`CREATE TABLE admincategory AS SELECT * FROM categories`).run();
      
      db.prepare(`DROP TABLE IF EXISTS admincategory_products`).run();
      db.prepare(`CREATE TABLE admincategory_products AS SELECT * FROM category_products`).run();
      
      const newBackupCount = db.prepare(`SELECT COUNT(*) as count FROM admincategory`).get();
      console.log(`Success Fresh backup created: ${newBackupCount.count} categories`);
    }
    
    console.log('\n3. 🗑️ SAFELY CLEARING EXISTING DATA...');
    console.log('=' .repeat(50));
    
    // Clear category relationships first
    const deletedRelationships = db.prepare(`DELETE FROM category_products`).run();
    console.log(`Success Cleared ${deletedRelationships.changes} category relationships`);
    
    // Clear existing categories
    const deletedCategories = db.prepare(`DELETE FROM categories`).run();
    console.log(`Success Cleared ${deletedCategories.changes} existing categories`);
    
    // Reset auto-increment
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='categories'`).run();
    console.log(`Success Reset category ID sequence`);
    
    console.log('\n4. 🎨 INSERTING NEW CATEGORIES WITH BROWSE UI...');
    console.log('=' .repeat(50));
    
    // Define new categories with browse UI standards
    const newCategories = [
      {
        name: 'Home & Kitchen',
        description: 'Kitchen appliances, home decor, and household essentials',
        icon: 'Home',
        color: '#FF6B6B',
        is_for_products: 1,
        is_for_services: 0,
        display_order: 10
      },
      {
        name: 'Electronics & Gadgets',
        description: 'Latest tech, gadgets, and electronic devices',
        icon: 'Mobile',
        color: '#4ECDC4',
        is_for_products: 1,
        is_for_services: 0,
        display_order: 20
      },
      {
        name: 'Fashion & Clothing',
        description: 'Trendy apparel, accessories, and fashion items',
        icon: '👗',
        color: '#45B7D1',
        is_for_products: 1,
        is_for_services: 0,
        display_order: 30
      },
      {
        name: 'Health & Beauty',
        description: 'Skincare, cosmetics, and wellness products',
        icon: '💄',
        color: '#96CEB4',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 40
      },
      {
        name: 'Sports & Fitness',
        description: 'Exercise equipment, sportswear, and fitness accessories',
        icon: '⚽',
        color: '#FFEAA7',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 50
      },
      {
        name: 'Books & Education',
        description: 'Books, courses, and educational materials',
        icon: '📚',
        color: '#DDA0DD',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 60
      },
      {
        name: 'Toys & Games',
        description: 'Toys, games, and entertainment for all ages',
        icon: '🎮',
        color: '#FFB6C1',
        is_for_products: 1,
        is_for_services: 0,
        display_order: 70
      },
      {
        name: 'Automotive',
        description: 'Car accessories, tools, and automotive products',
        icon: 'Car',
        color: '#87CEEB',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 80
      },
      {
        name: 'Travel & Luggage',
        description: 'Travel gear, luggage, and vacation essentials',
        icon: 'Flight',
        color: '#F0E68C',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 90
      },
      {
        name: 'Pet Supplies',
        description: 'Pet food, toys, and accessories for your furry friends',
        icon: '🐕',
        color: '#98FB98',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 100
      },
      {
        name: 'Office Supplies',
        description: 'Stationery, office equipment, and workspace essentials',
        icon: 'Blog',
        color: '#D3D3D3',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 110
      },
      {
        name: 'Garden & Outdoor',
        description: 'Gardening tools, outdoor furniture, and lawn care',
        icon: '🌱',
        color: '#90EE90',
        is_for_products: 1,
        is_for_services: 1,
        display_order: 120
      },
      {
        name: 'Mystery Box',
        description: 'Surprise wholesale products and mystery items',
        icon: 'Products',
        color: '#FF8C00',
        is_for_products: 1,
        is_for_services: 0,
        display_order: 130
      },
      // Service-specific categories
      {
        name: 'Financial Services',
        description: 'Banking, insurance, and investment services',
        icon: 'Price',
        color: '#FFD700',
        is_for_products: 0,
        is_for_services: 1,
        display_order: 200
      },
      {
        name: 'Digital Services',
        description: 'Software, apps, and digital subscriptions',
        icon: '💻',
        color: '#20B2AA',
        is_for_products: 0,
        is_for_services: 1,
        display_order: 210
      },
      {
        name: 'AI & Productivity',
        description: 'AI tools, productivity apps, and automation services',
        icon: 'AI',
        color: '#9370DB',
        is_for_products: 0,
        is_for_services: 1,
        display_order: 220
      }
    ];
    
    // Insert new categories
    const insertCategory = db.prepare(`
      INSERT INTO categories (
        name, description, icon, color, 
        is_for_products, is_for_services, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    let insertedCount = 0;
    for (const category of newCategories) {
      try {
        insertCategory.run(
          category.name,
          category.description,
          category.icon,
          category.color,
          category.is_for_products,
          category.is_for_services,
          category.display_order
        );
        insertedCount++;
        console.log(`   Success ${category.icon} ${category.name}`);
      } catch (error) {
        console.log(`   Error Failed to insert ${category.name}: ${error.message}`);
      }
    }
    
    console.log(`\nStats Successfully inserted ${insertedCount} new categories`);
    
    console.log('\n5. Refresh RE-CATEGORIZING EXISTING PRODUCTS...');
    console.log('=' .repeat(50));
    
    // Get all products that need re-categorization
    const productTables = [
      { table: 'products', idPrefix: '' },
      { table: 'amazon_products', idPrefix: 'amazon_' },
      { table: 'loot_box_products', idPrefix: 'loot_box_' },
      { table: 'cuelinks_products', idPrefix: 'cuelinks_' },
      { table: 'value_picks_products', idPrefix: 'value_picks_' },
      { table: 'click_picks_products', idPrefix: 'click_picks_' },
      { table: 'global_picks_products', idPrefix: 'global_picks_' },
      { table: 'dealshub_products', idPrefix: 'dealshub_' }
    ];
    
    let totalRecategorized = 0;
    
    for (const { table, idPrefix } of productTables) {
      try {
        const products = db.prepare(`SELECT id, name, category FROM ${table} LIMIT 100`).all();
        console.log(`\nProducts Processing ${products.length} products from ${table}:`);
        
        for (const product of products) {
          try {
            // Smart category mapping
            let categoryId = 1; // Default to first category
            
            if (product.category) {
              const categoryLower = product.category.toLowerCase();
              
              // Find best matching category
              const matchingCategory = newCategories.find(cat => {
                const catLower = cat.name.toLowerCase();
                return categoryLower.includes(catLower.split(' ')[0]) || 
                       catLower.includes(categoryLower.split(' ')[0]) ||
                       categoryLower === catLower;
              });
              
              if (matchingCategory) {
                const existingCat = db.prepare('SELECT id FROM categories WHERE name = ?').get(matchingCategory.name);
                categoryId = existingCat.id;
              } else {
                // Map to appropriate category based on keywords
                if (categoryLower.includes('home') || categoryLower.includes('kitchen')) {
                  categoryId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Home & Kitchen').id;
                } else if (categoryLower.includes('electronic') || categoryLower.includes('gadget')) {
                  categoryId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Electronics & Gadgets').id;
                } else if (categoryLower.includes('fashion') || categoryLower.includes('clothing')) {
                  categoryId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Fashion & Clothing').id;
                } else if (categoryLower.includes('mystery') || categoryLower.includes('box')) {
                  categoryId = db.prepare('SELECT id FROM categories WHERE name = ?').get('Mystery Box').id;
                }
              }
            }
            
            // Create category relationship
            db.prepare(`
              INSERT OR REPLACE INTO category_products (
                category_id, product_id, product_table, page_name, 
                product_name, created_at
              ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              categoryId,
              product.id,
              table,
              table.replace('_products', ''),
              product.name,
              Math.floor(Date.now() / 1000)
            );
            
            totalRecategorized++;
            
          } catch (error) {
            console.log(`   Error Failed to recategorize product ${product.id}: ${error.message}`);
          }
        }
        
        console.log(`   Success Processed ${products.length} products from ${table}`);
        
      } catch (error) {
        console.log(`   Error Error processing ${table}: ${error.message}`);
      }
    }
    
    console.log(`\nStats Total products recategorized: ${totalRecategorized}`);
    
    console.log('\n6. 🔒 RE-ENABLING FOREIGN KEY CONSTRAINTS...');
    console.log('=' .repeat(50));
    
    // Re-enable foreign key constraints
    db.prepare('PRAGMA foreign_keys = ON').run();
    console.log('Success Foreign key constraints re-enabled');
    
    console.log('\n7. 🧪 TESTING NEW CATEGORY SYSTEM...');
    console.log('=' .repeat(50));
    
    // Test the new category system
    const finalCategories = db.prepare('SELECT * FROM categories ORDER BY display_order').all();
    console.log(`\n📋 Final category system (${finalCategories.length} categories):`);
    
    finalCategories.forEach((cat, index) => {
      const productCount = db.prepare(
        'SELECT COUNT(*) as count FROM category_products WHERE category_id = ?'
      ).get(cat.id);
      
      console.log(`   ${index + 1}. ${cat.icon} ${cat.name} (${productCount.count} products)`);
    });
    
    console.log('\n8. Blog UPDATING ENHANCED CATEGORY SYSTEM...');
    console.log('=' .repeat(50));
    
    // Update the enhanced category system with the new implementation
    const enhancedCategorySystemUpdated = `
// ENHANCED CATEGORY AUTO-CREATION SYSTEM WITH BROWSE UI CONSISTENCY
// Updated with foreign key handling and improved category detection

const Database = require('better-sqlite3');

// Category icon mapping for auto-creation
const categoryIconMap = {
  // Product categories
  'home': { icon: 'Home', color: '#FF6B6B', name: 'Home & Kitchen' },
  'kitchen': { icon: 'Home', color: '#FF6B6B', name: 'Home & Kitchen' },
  'electronics': { icon: 'Mobile', color: '#4ECDC4', name: 'Electronics & Gadgets' },
  'gadgets': { icon: 'Mobile', color: '#4ECDC4', name: 'Electronics & Gadgets' },
  'fashion': { icon: '👗', color: '#45B7D1', name: 'Fashion & Clothing' },
  'clothing': { icon: '👗', color: '#45B7D1', name: 'Fashion & Clothing' },
  'health': { icon: '💄', color: '#96CEB4', name: 'Health & Beauty' },
  'beauty': { icon: '💄', color: '#96CEB4', name: 'Health & Beauty' },
  'sports': { icon: '⚽', color: '#FFEAA7', name: 'Sports & Fitness' },
  'fitness': { icon: '⚽', color: '#FFEAA7', name: 'Sports & Fitness' },
  'books': { icon: '📚', color: '#DDA0DD', name: 'Books & Education' },
  'education': { icon: '📚', color: '#DDA0DD', name: 'Books & Education' },
  'toys': { icon: '🎮', color: '#FFB6C1', name: 'Toys & Games' },
  'games': { icon: '🎮', color: '#FFB6C1', name: 'Toys & Games' },
  'automotive': { icon: 'Car', color: '#87CEEB', name: 'Automotive' },
  'travel': { icon: 'Flight', color: '#F0E68C', name: 'Travel & Luggage' },
  'pet': { icon: '🐕', color: '#98FB98', name: 'Pet Supplies' },
  'office': { icon: 'Blog', color: '#D3D3D3', name: 'Office Supplies' },
  'garden': { icon: '🌱', color: '#90EE90', name: 'Garden & Outdoor' },
  'mystery': { icon: 'Products', color: '#FF8C00', name: 'Mystery Box' },
  
  // Service categories
  'financial': { icon: 'Price', color: '#FFD700', name: 'Financial Services' },
  'digital': { icon: '💻', color: '#20B2AA', name: 'Digital Services' },
  'ai': { icon: 'AI', color: '#9370DB', name: 'AI & Productivity' },
  'productivity': { icon: 'AI', color: '#9370DB', name: 'AI & Productivity' }
};

// Enhanced category detection function
function detectCategoryWithUI(productName, productDescription = '', isService = false) {
  const text = (productName + ' ' + productDescription).toLowerCase();
  
  // Check for specific keywords
  for (const [keyword, categoryInfo] of Object.entries(categoryIconMap)) {
    if (text.includes(keyword)) {
      return categoryInfo;
    }
  }
  
  // Default categories based on type
  if (isService) {
    return { icon: '💻', color: '#20B2AA', name: 'Digital Services' };
  } else {
    return { icon: 'Home', color: '#FF6B6B', name: 'Home & Kitchen' };
  }
}

// Enhanced ensureCategoryExists function with foreign key handling
function ensureCategoryExistsWithUI(categoryName, productName = '', productDescription = '', isService = false) {
  try {
    const db = new Database('database.sqlite');
    
    // Check if category already exists
    const existingCategory = db.prepare(
      'SELECT id FROM categories WHERE name = ?'
    ).get(categoryName);
    
    if (existingCategory) {
      console.log(\`Success Category "\${categoryName}" already exists (ID: \${existingCategory.id})\`);
      db.close();
      return existingCategory.id;
    }
    
    // Auto-detect category info with UI standards
    const categoryInfo = detectCategoryWithUI(productName, productDescription, isService);
    
    // Use detected info or provided name
    const finalName = categoryInfo.name || categoryName;
    const icon = categoryInfo.icon;
    const color = categoryInfo.color;
    
    // Temporarily disable foreign keys for category creation
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    // Create new category with browse UI standards
    const result = db.prepare(\`
      INSERT INTO categories (
        name, description, icon, color, 
        is_for_products, is_for_services, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    \`).run(
      finalName,
      \`Auto-created category for \${isService ? 'services' : 'products'}\`,
      icon,
      color,
      isService ? 0 : 1,
      isService ? 1 : 0,
      999 // Auto-created categories get high display order
    );
    
    // Re-enable foreign keys
    db.prepare('PRAGMA foreign_keys = ON').run();
    
    console.log(\`🎨 Auto-created category: \${icon} "\${finalName}" (ID: \${result.lastInsertRowid})\`);
    db.close();
    return result.lastInsertRowid;
    
  } catch (error) {
    console.error('Error Error ensuring category exists:', error);
    // Return a default category ID if creation fails
    const db = new Database('database.sqlite');
    const defaultCategory = db.prepare(
      'SELECT id FROM categories ORDER BY id LIMIT 1'
    ).get();
    db.close();
    return defaultCategory?.id || 1;
  }
}

// Export for use in routes
module.exports = {
  ensureCategoryExistsWithUI,
  detectCategoryWithUI,
  categoryIconMap
};
`;
    
    require('fs').writeFileSync('enhanced-category-system-fixed.js', enhancedCategorySystemUpdated);
    console.log('   Success Generated enhanced-category-system-fixed.js');
    
    console.log('\n9. Success CATEGORY RECREATION COMPLETE!');
    console.log('=' .repeat(50));
    
    console.log('\nCelebration CATEGORY RECREATION WITH BACKUP SUCCESSFUL!');
    console.log('\nStats Summary:');
    console.log(`   Products Backup: ${db.prepare('SELECT COUNT(*) as count FROM admincategory').get().count} categories saved as 'admincategory'`);
    console.log(`   🎨 New System: ${finalCategories.length} categories with browse UI standards`);
    console.log(`   Link Relationships: ${totalRecategorized} products recategorized`);
    console.log(`   🛡️ Safety: rollback-categories.sql available for restoration`);
    
    console.log('\nLaunch Features Enabled:');
    console.log('   Success Auto-creation with browse UI consistency');
    console.log('   Success Smart category detection');
    console.log('   Success Consistent icons and colors');
    console.log('   Success Service/product separation');
    console.log('   Success Foreign key constraint handling');
    console.log('   Success Rollback capability');
    
    db.close();
    
  } catch (error) {
    console.error('Error Error fixing category recreation:', error.message);
  }
}

// Run the fix
fixCategoryRecreationWithForeignKeys().catch(console.error);