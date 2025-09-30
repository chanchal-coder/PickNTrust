// Check Loot Box Product Categories
// See what categories are assigned to loot-box products

const Database = require('better-sqlite3');

console.log('Search CHECKING LOOT BOX PRODUCT CATEGORIES');
console.log('=' .repeat(50));

function checkLootBoxCategories() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\nProducts Checking loot_box_products table...');
    
    // Get all loot box products with their categories
    const products = db.prepare(`
      SELECT id, name, category, processing_status, created_at
      FROM loot_box_products 
      ORDER BY id DESC
    `).all();
    
    console.log(`\nStats Total products in loot_box_products: ${products.length}`);
    
    if (products.length === 0) {
      console.log('Error No products found in loot_box_products table');
      db.close();
      return;
    }
    
    console.log('\n📋 Product Categories Analysis:');
    console.log('=' .repeat(50));
    
    const categoryStats = {};
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. Product ID: ${product.id}`);
      console.log(`   Name: ${product.name?.substring(0, 60)}...`);
      console.log(`   Category: "${product.category || 'NULL'}"`);
      console.log(`   Status: ${product.processing_status}`);
      console.log(`   Created: ${new Date(product.created_at * 1000).toLocaleString()}`);
      
      // Count categories
      const category = product.category || 'NULL';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    console.log('\nStats Category Statistics:');
    console.log('=' .repeat(30));
    
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   "${category}": ${count} products`);
    });
    
    // Check if any products have NULL or empty categories
    const productsWithoutCategory = products.filter(p => !p.category || p.category.trim() === '');
    
    if (productsWithoutCategory.length > 0) {
      console.log('\nWarning ISSUE FOUND: Products without categories');
      console.log(`   ${productsWithoutCategory.length} products have NULL or empty categories`);
      
      console.log('\n🔧 FIXING CATEGORIES...');
      
      // Assign appropriate categories based on product names
      const categoryMappings = {
        'agarbatti': 'Home & Living',
        'incense': 'Home & Living',
        'masala': 'Home & Living',
        'coffee': 'Home & Kitchen',
        'mug': 'Home & Kitchen',
        'cup': 'Home & Kitchen',
        'sealer': 'Electronics & Gadgets',
        'heat': 'Electronics & Gadgets',
        'bag': 'Electronics & Gadgets',
        'kitchen': 'Home & Kitchen',
        'home': 'Home & Living'
      };
      
      let fixedCount = 0;
      
      productsWithoutCategory.forEach(product => {
        let assignedCategory = 'Electronics & Gadgets'; // Default category
        
        // Try to detect category from product name
        const productName = (product.name || '').toLowerCase();
        
        for (const [keyword, category] of Object.entries(categoryMappings)) {
          if (productName.includes(keyword)) {
            assignedCategory = category;
            break;
          }
        }
        
        // Update the product category
        const updateResult = db.prepare(`
          UPDATE loot_box_products 
          SET category = ?, updated_at = ?
          WHERE id = ?
        `).run(assignedCategory, Math.floor(Date.now() / 1000), product.id);
        
        if (updateResult.changes > 0) {
          console.log(`   Success Fixed Product ${product.id}: "${assignedCategory}"`);
          fixedCount++;
        } else {
          console.log(`   Error Failed to fix Product ${product.id}`);
        }
      });
      
      console.log(`\n📈 CATEGORY FIX SUMMARY:`);
      console.log(`   Products fixed: ${fixedCount}`);
      console.log(`   Products remaining: ${productsWithoutCategory.length - fixedCount}`);
      
      if (fixedCount > 0) {
        console.log('\nRefresh Re-checking categories after fix...');
        
        const updatedProducts = db.prepare(`
          SELECT DISTINCT category 
          FROM loot_box_products 
          WHERE processing_status = 'active' 
          AND category IS NOT NULL 
          AND category != ''
          ORDER BY category ASC
        `).all();
        
        console.log('\n📂 Updated Categories:');
        updatedProducts.forEach((row, index) => {
          console.log(`   ${index + 1}. "${row.category}"`);
        });
        
        console.log('\nSuccess CATEGORIES FIXED!');
        console.log('   🔧 Loot box side panel should now show categories');
        console.log('   🛒 Browse categories should now include wholesale products');
      }
      
    } else {
      console.log('\nSuccess All products have categories assigned');
      
      // Show distinct categories
      const distinctCategories = db.prepare(`
        SELECT DISTINCT category 
        FROM loot_box_products 
        WHERE processing_status = 'active' 
        AND category IS NOT NULL 
        AND category != ''
        ORDER BY category ASC
      `).all();
      
      console.log('\n📂 Available Categories for Filtering:');
      distinctCategories.forEach((row, index) => {
        console.log(`   ${index + 1}. "${row.category}"`);
      });
    }
    
    db.close();
    
  } catch (error) {
    console.error('Error Error checking categories:', error.message);
  }
}

// Run the check
checkLootBoxCategories();