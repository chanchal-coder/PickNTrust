const Database = require('better-sqlite3');

console.log('🔧 Updating test product display_pages...');

const db = new Database('./database.sqlite');

try {
  // First, check current state
  const currentProduct = db.prepare('SELECT title, display_pages FROM unified_content WHERE title LIKE ?').get('%Test Product%');
  console.log('Current product:', currentProduct);
  
  // Update the display_pages to include prime-picks
  const result = db.prepare('UPDATE unified_content SET display_pages = ? WHERE title LIKE ?').run('["prime-picks"]', '%Test Product%');
  console.log('Updated rows:', result.changes);
  
  // Verify the update
  const updatedProduct = db.prepare('SELECT title, display_pages FROM unified_content WHERE title LIKE ?').get('%Test Product%');
  console.log('Updated product:', updatedProduct);
  
} catch (error) {
  console.error('Error updating product:', error);
} finally {
  db.close();
}