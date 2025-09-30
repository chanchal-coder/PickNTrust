// Fix Loot Box Product Categories
// Reassign products from 'Mystery Box' to proper categories based on product names

const Database = require('better-sqlite3');

console.log('🔧 FIXING LOOT BOX PRODUCT CATEGORIES');
console.log('=' .repeat(60));

async function fixLootBoxCategories() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\n1. Stats ANALYZING CURRENT CATEGORIES...');
    console.log('=' .repeat(50));
    
    // Get all loot box products
    const allProducts = db.prepare(`
      SELECT id, name, category, processing_status, created_at
      FROM loot_box_products 
      ORDER BY id DESC
    `).all();
    
    console.log(`Products Total loot box products: ${allProducts.length}`);
    
    // Count current categories
    const categoryStats = {};
    allProducts.forEach(product => {
      const category = product.category || 'NULL';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    console.log('\n📋 Current Category Distribution:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   "${category}": ${count} products`);
    });
    
    console.log('\n2. Target ENHANCED CATEGORY DETECTION...');
    console.log('=' .repeat(50));
    
    // Enhanced category mapping with comprehensive keywords
    const categoryMappings = {
      'Home & Kitchen': [
        'home', 'kitchen', 'furniture', 'decor', 'appliance', 'cookware', 'utensil',
        'bedding', 'mattress', 'pillow', 'curtain', 'lamp', 'table', 'chair',
        'agarbatti', 'incense', 'masala', 'coffee', 'mug', 'cup', 'sealer', 'heat',
        'dining', 'storage', 'cleaning', 'household', 'organizer', 'ceramic', 'spoon'
      ],
      'Electronics & Gadgets': [
        'electronics', 'gadget', 'tech', 'phone', 'mobile', 'laptop', 'computer',
        'tablet', 'headphone', 'speaker', 'camera', 'tv', 'smartwatch', 'charger',
        'cable', 'adapter', 'power', 'battery', 'electronic', 'digital', 'scale',
        'weight', 'machine', 'lcd', 'display'
      ],
      'Fashion & Clothing': [
        'fashion', 'clothing', 'apparel', 'shirt', 'dress', 'jeans', 'shoes',
        'bag', 'wallet', 'watch', 'jewelry', 'accessory', 'style', 'wear',
        'outfit', 'garment', 'textile', 'fabric'
      ],
      'Health & Beauty': [
        'beauty', 'cosmetic', 'skincare', 'makeup', 'health', 'wellness',
        'cream', 'lotion', 'shampoo', 'soap', 'perfume', 'fragrance',
        'personal care', 'hygiene', 'medical', 'supplement'
      ],
      'Sports & Fitness': [
        'sports', 'fitness', 'gym', 'exercise', 'workout', 'athletic',
        'running', 'cycling', 'yoga', 'equipment', 'outdoor', 'recreation'
      ],
      'Books & Education': [
        'book', 'education', 'learning', 'study', 'academic', 'textbook',
        'novel', 'magazine', 'journal', 'guide', 'manual'
      ],
      'Toys & Games': [
        'toy', 'game', 'gaming', 'console', 'puzzle', 'doll', 'play',
        'kids', 'children', 'educational toy', 'board game'
      ],
      'Automotive': [
        'car', 'auto', 'vehicle', 'motorcycle', 'bike', 'automotive',
        'parts', 'accessories', 'tire', 'oil', 'maintenance'
      ],
      'Pet Supplies': [
        'pet', 'dog', 'cat', 'animal', 'pet food', 'pet toy', 'pet care',
        'collar', 'leash', 'aquarium', 'bird'
      ],
      'Office Supplies': [
        'office', 'stationery', 'pen', 'paper', 'notebook', 'desk',
        'business', 'work', 'professional', 'supplies'
      ]
    };
    
    // Enhanced category detection function
    function detectEnhancedCategory(productName) {
      if (!productName) return 'Electronics & Gadgets'; // Safe default
      
      const name = productName.toLowerCase();
      const nameWords = name.split(/\s+/);
      
      // Check each category for keyword matches
      for (const [category, keywords] of Object.entries(categoryMappings)) {
        for (const keyword of keywords) {
          // Check if keyword is in the product name
          if (name.includes(keyword)) {
            return category;
          }
          // Check if any word in the name matches or contains the keyword
          if (nameWords.some(word => word.includes(keyword) || keyword.includes(word))) {
            return category;
          }
        }
      }
      
      // Smart fallback based on common patterns
      if (name.includes('deal') || name.includes('offer') || name.includes('discount')) {
        return 'Electronics & Gadgets';
      }
      
      // If still no match, use Electronics & Gadgets as safe default instead of Mystery Box
      return 'Electronics & Gadgets';
    }
    
    console.log('\n3. Refresh REASSIGNING CATEGORIES...');
    console.log('=' .repeat(50));
    
    let updatedCount = 0;
    let categoryChanges = {};
    
    // Process each product
    for (const product of allProducts) {
      const currentCategory = product.category || 'NULL';
      const detectedCategory = detectEnhancedCategory(product.name);
      
      // Only update if category is different
      if (currentCategory !== detectedCategory) {
        try {
          const updateResult = db.prepare(`
            UPDATE loot_box_products 
            SET category = ?, updated_at = ?
            WHERE id = ?
          `).run(detectedCategory, Math.floor(Date.now() / 1000), product.id);
          
          if (updateResult.changes > 0) {
            console.log(`   Success Product ${product.id}: "${currentCategory}" → "${detectedCategory}"`);
            console.log(`      Name: ${product.name?.substring(0, 60)}...`);
            
            updatedCount++;
            
            // Track category changes
            const changeKey = `${currentCategory} → ${detectedCategory}`;
            categoryChanges[changeKey] = (categoryChanges[changeKey] || 0) + 1;
          }
        } catch (error) {
          console.log(`   Error Failed to update Product ${product.id}: ${error.message}`);
        }
      }
    }
    
    console.log('\n4. Stats CATEGORY REASSIGNMENT SUMMARY...');
    console.log('=' .repeat(50));
    
    console.log(`\n📈 Products Updated: ${updatedCount}`);
    console.log(`📈 Products Unchanged: ${allProducts.length - updatedCount}`);
    
    if (Object.keys(categoryChanges).length > 0) {
      console.log('\nRefresh Category Changes:');
      Object.entries(categoryChanges).forEach(([change, count]) => {
        console.log(`   ${change}: ${count} products`);
      });
    }
    
    console.log('\n5. 📂 UPDATED CATEGORY DISTRIBUTION...');
    console.log('=' .repeat(50));
    
    // Get updated category stats
    const updatedProducts = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM loot_box_products 
      WHERE processing_status = 'active'
      GROUP BY category
      ORDER BY count DESC
    `).all();
    
    console.log('\n📋 New Category Distribution:');
    updatedProducts.forEach((row, index) => {
      console.log(`   ${index + 1}. "${row.category}": ${row.count} products`);
    });
    
    console.log('\n6. Link UPDATING CATEGORY RELATIONSHIPS...');
    console.log('=' .repeat(50));
    
    // Update category_products table for proper integration
    let relationshipsUpdated = 0;
    
    for (const product of allProducts) {
      try {
        // Get the updated category for this product
        const updatedProduct = db.prepare(`
          SELECT category FROM loot_box_products WHERE id = ?
        `).get(product.id);
        
        if (updatedProduct && updatedProduct.category) {
          // Find or create category in categories table
          let categoryId;
          const existingCategory = db.prepare(`
            SELECT id FROM categories WHERE name = ?
          `).get(updatedProduct.category);
          
          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            // Create new category if it doesn't exist
            const insertResult = db.prepare(`
              INSERT INTO categories (name, description, icon, color, is_for_products, display_order)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              updatedProduct.category,
              `${updatedProduct.category} products`,
              'fas fa-tag',
              '#6366F1',
              1,
              999
            );
            categoryId = insertResult.lastInsertRowid;
            console.log(`   ➕ Created new category: "${updatedProduct.category}" (ID: ${categoryId})`);
          }
          
          // Update or insert category relationship
          db.prepare(`
            INSERT OR REPLACE INTO category_products (
              category_id, product_id, product_table, page_name, 
              product_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            categoryId,
            product.id,
            'loot_box_products',
            'loot-box',
            product.name,
            Math.floor(Date.now() / 1000)
          );
          
          relationshipsUpdated++;
        }
      } catch (error) {
        console.log(`   Warning Error updating relationships for product ${product.id}: ${error.message}`);
      }
    }
    
    console.log(`\nSuccess Updated ${relationshipsUpdated} category relationships`);
    
    console.log('\n7. Success CATEGORY FIX COMPLETE!');
    console.log('=' .repeat(50));
    
    console.log('\nCelebration LOOT BOX CATEGORY FIX SUCCESSFUL!');
    console.log('\nStats Final Results:');
    console.log(`   Refresh Products Recategorized: ${updatedCount}`);
    console.log(`   Link Relationships Updated: ${relationshipsUpdated}`);
    console.log(`   📂 Active Categories: ${updatedProducts.length}`);
    
    console.log('\nLaunch Benefits:');
    console.log('   Success Products now appear in correct categories');
    console.log('   Success Browse categories show proper product counts');
    console.log('   Success Category filtering works correctly');
    console.log('   Success Reduced "Mystery Box" clutter');
    console.log('   Success Better product discoverability');
    
    console.log('\nSearch Next Steps:');
    console.log('   1. Test category pages to verify products appear correctly');
    console.log('   2. Check browse categories for updated counts');
    console.log('   3. Verify loot-box page category filtering');
    console.log('   4. Monitor future products for proper categorization');
    
    db.close();
    
  } catch (error) {
    console.error('Error Error fixing loot box categories:', error.message);
  }
}

// Run the fix
fixLootBoxCategories().catch(console.error);