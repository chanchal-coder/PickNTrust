const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('🔧 Fixing page assignments for products...');
  
  // Get all products
  const allProducts = db.prepare('SELECT id, title, display_pages FROM unified_content').all();
  console.log(`Found ${allProducts.length} products to assign to pages`);
  
  // Define page assignments - distribute products across different pages
  const pageAssignments = [
    { pages: ['home', 'prime-picks'], productIds: [1, 2] },
    { pages: ['home', 'global-picks'], productIds: [3, 6] },
    { pages: ['home', 'value-picks'], productIds: [7] },
    { pages: ['home', 'deals-hub'], productIds: [1, 3] },
    { pages: ['home', 'click-picks'], productIds: [2, 6] },
    { pages: ['home', 'cue-picks'], productIds: [7, 1] },
    { pages: ['home', 'loot-box'], productIds: [2, 3] },
    { pages: ['home', 'travel-picks'], productIds: [6, 7] }
  ];
  
  // Update products with new page assignments
  const updateStatement = db.prepare('UPDATE unified_content SET display_pages = ? WHERE id = ?');
  
  pageAssignments.forEach(assignment => {
    const pagesJson = JSON.stringify(assignment.pages);
    assignment.productIds.forEach(productId => {
      const result = updateStatement.run(pagesJson, productId);
      if (result.changes > 0) {
        console.log(`✅ Updated product ${productId} to pages: ${assignment.pages.join(', ')}`);
      }
    });
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
  });
  
  // Also ensure all products have correct status
  console.log('\n🔧 Ensuring all products have active status...');
  const statusUpdate = db.prepare(`
    UPDATE unified_content 
    SET processing_status = 'active', status = 'active' 
    WHERE processing_status != 'active' OR status != 'active'
  `);
  
  const statusResult = statusUpdate.run();
  console.log(`✅ Updated ${statusResult.changes} products to active status`);
  
  db.close();
  console.log('\n✅ Page assignments completed successfully!');
  
} catch (error) {
  console.error('❌ Error fixing page assignments:', error.message);
}