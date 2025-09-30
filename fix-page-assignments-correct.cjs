const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('🔧 Properly fixing page assignments for products...');
  
  // Get all products
  const allProducts = db.prepare('SELECT id, title, display_pages FROM unified_content').all();
  console.log(`Found ${allProducts.length} products to assign to pages`);
  
  // Define proper page assignments - each product gets assigned to specific pages
  const pageAssignments = [
    { productId: 1, pages: ['home', 'prime-picks', 'deals-hub'] },
    { productId: 2, pages: ['home', 'prime-picks', 'click-picks', 'loot-box'] },
    { productId: 3, pages: ['home', 'global-picks', 'deals-hub', 'loot-box'] },
    { productId: 6, pages: ['home', 'global-picks', 'click-picks', 'travel-picks'] },
    { productId: 7, pages: ['home', 'value-picks', 'cue-picks', 'travel-picks'] },
    { productId: 181, pages: ['home', 'prime-picks', 'value-picks'] },
    { productId: 182, pages: ['home', 'global-picks', 'cue-picks'] },
    { productId: 183, pages: ['home', 'deals-hub', 'loot-box'] },
    { productId: 184, pages: ['home', 'click-picks', 'travel-picks'] },
    { productId: 185, pages: ['home', 'prime-picks', 'global-picks'] },
    { productId: 186, pages: ['home', 'top-picks', 'featured', 'value-picks'] }
  ];
  
  // Update products with new page assignments
  const updateStatement = db.prepare('UPDATE unified_content SET display_pages = ? WHERE id = ?');
  
  pageAssignments.forEach(assignment => {
    const pagesJson = JSON.stringify(assignment.pages);
    const result = updateStatement.run(pagesJson, assignment.productId);
    if (result.changes > 0) {
      console.log(`✅ Updated product ${assignment.productId} to pages: ${assignment.pages.join(', ')}`);
    } else {
      console.log(`⚠️ Product ${assignment.productId} not found`);
    }
  });
  
  // Verify the updates
  console.log('\n📊 Verification - Products per page:');
  const pages = ['prime-picks', 'global-picks', 'value-picks', 'deals-hub', 'click-picks', 'cue-picks', 'loot-box', 'travel-picks'];
  
  pages.forEach(page => {
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE display_pages LIKE '%' || ? || '%'
      AND processing_status = 'active'
      AND status = 'active'
    `).get(page);
    console.log(`   ${page}: ${count.count} products`);
    
    // Show sample products for this page
    if (count.count > 0) {
      const samples = db.prepare(`
        SELECT id, title FROM unified_content 
        WHERE display_pages LIKE '%' || ? || '%'
        AND processing_status = 'active'
        AND status = 'active'
        LIMIT 3
      `).all(page);
      samples.forEach(sample => {
        console.log(`      - ID ${sample.id}: ${sample.title}`);
      });
    }
  });
  
  db.close();
  console.log('\n✅ Page assignments completed successfully!');
  
} catch (error) {
  console.error('❌ Error fixing page assignments:', error.message);
}