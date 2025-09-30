const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Search Checking product categorization issues...');
  
  // Check for electronics products in wrong categories
  const wrongCategories = db.prepare(`
    SELECT name as product_name, category, description 
    FROM products 
    WHERE (
      name LIKE '%mouse%' OR 
      name LIKE '%keyboard%' OR 
      name LIKE '%headphone%' OR 
      name LIKE '%laptop%' OR
      name LIKE '%computer%' OR
      name LIKE '%phone%' OR
      name LIKE '%tablet%' OR
      name LIKE '%camera%' OR
      name LIKE '%speaker%' OR
      name LIKE '%charger%'
    ) AND category != 'Electronics & Gadgets' 
    LIMIT 20
  `).all();
  
  console.log(`\nError Found ${wrongCategories.length} electronics products in wrong categories:`);
  wrongCategories.forEach(p => {
    console.log(`- "${p.product_name}" → Currently in: "${p.category}" (Should be: Electronics & Gadgets)`);
  });
  
  // Check what's currently in Sports & Fitness
  const sportsProducts = db.prepare(`
    SELECT name, category, description 
    FROM products 
    WHERE category = 'Sports & Fitness' 
    LIMIT 15
  `).all();
  
  console.log(`\n🏃 Products currently in Sports & Fitness (${sportsProducts.length} found):`);
  sportsProducts.forEach(p => {
    console.log(`- "${p.name}"`);
  });
  
  // Check for obvious non-sports items in sports category
  const nonSportsInSports = db.prepare(`
    SELECT name, category, description 
    FROM products 
    WHERE category = 'Sports & Fitness' AND (
      name LIKE '%mouse%' OR 
      name LIKE '%keyboard%' OR 
      name LIKE '%headphone%' OR 
      name LIKE '%laptop%' OR
      name LIKE '%computer%' OR
      name LIKE '%phone%' OR
      name LIKE '%tablet%' OR
      name LIKE '%camera%' OR
      name LIKE '%speaker%' OR
      name LIKE '%charger%' OR
      name LIKE '%cable%' OR
      name LIKE '%adapter%'
    )
  `).all();
  
  if (nonSportsInSports.length > 0) {
    console.log(`\nAlert CRITICAL: Found ${nonSportsInSports.length} electronics items wrongly categorized as Sports & Fitness:`);
    nonSportsInSports.forEach(p => {
      console.log(`- "${p.name}" (This is clearly electronics, not sports!)`);
    });
    
    console.log('\n🔧 Fixing these categorization errors...');
    
    // Fix the categorization
    const updateStmt = db.prepare(`
      UPDATE products 
      SET category = 'Electronics & Gadgets' 
      WHERE category = 'Sports & Fitness' AND (
        name LIKE '%mouse%' OR 
        name LIKE '%keyboard%' OR 
        name LIKE '%headphone%' OR 
        name LIKE '%laptop%' OR
        name LIKE '%computer%' OR
        name LIKE '%phone%' OR
        name LIKE '%tablet%' OR
        name LIKE '%camera%' OR
        name LIKE '%speaker%' OR
        name LIKE '%charger%' OR
        name LIKE '%cable%' OR
        name LIKE '%adapter%'
      )
    `);
    
    const result = updateStmt.run();
    console.log(`Success Fixed ${result.changes} products - moved from Sports & Fitness to Electronics & Gadgets`);
    
    // Also update category_products table if it exists
    try {
      const updateCategoryProducts = db.prepare(`
        UPDATE category_products 
        SET category_name = 'Electronics & Gadgets'
        WHERE product_id IN (
          SELECT id FROM products 
          WHERE category = 'Electronics & Gadgets' AND (
            name LIKE '%mouse%' OR 
            name LIKE '%keyboard%' OR 
            name LIKE '%headphone%' OR 
            name LIKE '%laptop%' OR
            name LIKE '%computer%' OR
            name LIKE '%phone%' OR
            name LIKE '%tablet%' OR
            name LIKE '%camera%' OR
            name LIKE '%speaker%' OR
            name LIKE '%charger%' OR
            name LIKE '%cable%' OR
            name LIKE '%adapter%'
          )
        ) AND category_name = 'Sports & Fitness'
      `);
      
      const categoryResult = updateCategoryProducts.run();
      console.log(`Success Updated ${categoryResult.changes} category relationships`);
    } catch (e) {
      console.log('ℹ️  Category_products table update skipped (table may not exist)');
    }
    
  } else {
    console.log('\nSuccess No electronics items found in Sports & Fitness category');
  }
  
  // Final verification
  console.log('\nSearch Final verification...');
  const finalCheck = db.prepare(`
    SELECT name, category 
    FROM products 
    WHERE category = 'Sports & Fitness' AND (
      name LIKE '%mouse%' OR 
      name LIKE '%keyboard%' OR 
      name LIKE '%headphone%' OR 
      name LIKE '%laptop%'
    )
  `).all();
  
  if (finalCheck.length === 0) {
    console.log('Success SUCCESS: No more electronics items in Sports & Fitness category!');
  } else {
    console.log(`Error Still found ${finalCheck.length} electronics items in Sports & Fitness`);
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error fixing categorization:', error.message);
}