const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== FIXING VALUE-PICKS PROCESSING STATUS ===\n');
  
  // Update processing_status for value-picks products
  const updateResult = db.prepare(`
    UPDATE unified_content 
    SET processing_status = 'completed' 
    WHERE display_pages LIKE '%value-picks%'
  `).run();
  
  console.log('Updated', updateResult.changes, 'value-picks products');
  
  // Also update cue-picks and global-picks products
  const updateCueResult = db.prepare(`
    UPDATE unified_content 
    SET processing_status = 'completed' 
    WHERE display_pages LIKE '%cue-picks%'
  `).run();
  
  console.log('Updated', updateCueResult.changes, 'cue-picks products');
  
  const updateGlobalResult = db.prepare(`
    UPDATE unified_content 
    SET processing_status = 'completed' 
    WHERE display_pages LIKE '%global-picks%'
  `).run();
  
  console.log('Updated', updateGlobalResult.changes, 'global-picks products');
  
  // Verify the changes
  const valuePicksProducts = db.prepare(`
    SELECT id, title, processing_status, visibility, status 
    FROM unified_content 
    WHERE display_pages LIKE '%value-picks%'
  `).all();
  
  console.log('\nValue-picks products after update:');
  console.log(valuePicksProducts);
  
  db.close();
  console.log('\n✅ Processing status updated successfully!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}