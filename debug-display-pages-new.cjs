// Debug script to analyze displayPages storage and filtering
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('=== DISPLAY PAGES ANALYSIS ===');
  console.log('');
  
  // Check recent products and their display_pages
  const products = db.prepare(`
    SELECT id, title, display_pages, category, is_service, is_ai_app, created_at 
    FROM unified_content 
    WHERE is_active = 1 
    ORDER BY id DESC 
    LIMIT 15
  `).all();
  
  console.log('Recent Products:');
  products.forEach(p => {
    console.log(`ID: ${p.id}, Title: ${p.title?.substring(0, 40)}...`);
    console.log(`  Display Pages: ${p.display_pages}`);
    console.log(`  Category: ${p.category}, Service: ${p.is_service}, AI App: ${p.is_ai_app}`);
    console.log(`  Created: ${new Date(p.created_at * 1000).toISOString()}`);
    console.log('');
  });
  
  // Check unique display_pages values
  console.log('=== UNIQUE DISPLAY PAGES VALUES ===');
  const uniqueDisplayPages = db.prepare(`
    SELECT DISTINCT display_pages, COUNT(*) as count 
    FROM unified_content 
    WHERE is_active = 1 AND display_pages IS NOT NULL 
    GROUP BY display_pages 
    ORDER BY count DESC
  `).all();
  
  uniqueDisplayPages.forEach(dp => {
    console.log(`"${dp.display_pages}" - ${dp.count} products`);
  });
  
  // Test filtering for specific pages
  console.log('');
  console.log('=== FILTERING TEST ===');
  const testPages = ['click-picks', 'global-picks', 'prime-picks', 'apps'];
  
  testPages.forEach(page => {
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM unified_content 
      WHERE is_active = 1 AND (
        display_pages LIKE '%' || ? || '%' OR
        display_pages = ?
      )
    `).get(page, page);
    
    console.log(`${page}: ${count.count} products`);
  });
  
  db.close();
  console.log('');
  console.log('✅ Analysis complete');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}