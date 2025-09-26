const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== FIXING PROCESSING STATUS ===\n');
  
  // Check current status
  const currentProducts = db.prepare(`
    SELECT id, title, processing_status, display_pages 
    FROM unified_content 
    WHERE processing_status = 'processed'
  `).all();
  
  console.log(`Found ${currentProducts.length} products with 'processed' status`);
  
  // Update to 'active' status
  const updateStmt = db.prepare(`
    UPDATE unified_content 
    SET processing_status = 'active', updated_at = datetime('now')
    WHERE processing_status = 'processed'
  `);
  
  const result = updateStmt.run();
  console.log(`Updated ${result.changes} products to 'active' status`);
  
  // Verify the fix
  console.log('\nVerifying products by page after fix:');
  const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'global-picks', 'travel-picks', 'deals-hub', 'loot-box'];
  
  pages.forEach(page => {
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM unified_content 
      WHERE display_pages LIKE '%' || ? || '%' 
      AND processing_status = 'active'
    `).get(page);
    console.log(`  ${page}: ${count.count} products`);
  });
  
  db.close();
  console.log('\n✅ Processing status fixed!');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}