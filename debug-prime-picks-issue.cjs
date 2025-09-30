/**
 * Debug Prime Picks Issue - Why is it not returning products?
 */

const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 DEBUGGING PRIME-PICKS ISSUE');
console.log('='.repeat(50));

try {
  // Check all products with prime-picks in display_pages
  console.log('1. Products with "prime-picks" in display_pages:');
  const primePicksProducts = db.prepare(`
    SELECT id, title, display_pages, processing_status, created_at
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
    ORDER BY created_at DESC
  `).all();
  
  console.log(`   Found: ${primePicksProducts.length} products`);
  primePicksProducts.forEach(p => {
    console.log(`   ID ${p.id}: ${p.title}`);
    console.log(`      Display Pages: "${p.display_pages}"`);
    console.log(`      Status: "${p.processing_status}"`);
    console.log(`      Created: ${p.created_at}`);
    console.log('');
  });
  
  // Test the exact API query
  console.log('2. Testing exact API query:');
  const apiQuery = `
    SELECT * FROM unified_content 
    WHERE (
      display_pages LIKE '%' || ? || '%' OR
      display_pages = ?
    )
    AND processing_status = 'active'
    ORDER BY created_at DESC
  `;
  
  const apiResults = db.prepare(apiQuery).all('prime-picks', 'prime-picks');
  console.log(`   API Query Results: ${apiResults.length} products`);
  
  if (apiResults.length > 0) {
    apiResults.forEach(r => {
      console.log(`   ID ${r.id}: ${r.title}`);
      console.log(`      Display Pages: "${r.display_pages}"`);
      console.log(`      Status: "${r.processing_status}"`);
    });
  }
  
  // Check processing_status distribution for prime-picks
  console.log('3. Processing status distribution for prime-picks:');
  const statusDistribution = db.prepare(`
    SELECT processing_status, COUNT(*) as count
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
    GROUP BY processing_status
  `).all();
  
  statusDistribution.forEach(s => {
    console.log(`   ${s.processing_status || 'NULL'}: ${s.count} products`);
  });
  
  // Check if we need to fix processing_status
  console.log('4. Products that need processing_status fix:');
  const needsStatusFix = db.prepare(`
    SELECT id, title, processing_status
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
    AND (processing_status IS NULL OR processing_status != 'active')
  `).all();
  
  console.log(`   Found: ${needsStatusFix.length} products needing status fix`);
  needsStatusFix.forEach(p => {
    console.log(`   ID ${p.id}: ${p.title} - Status: ${p.processing_status || 'NULL'}`);
  });
  
  // Fix processing_status if needed
  if (needsStatusFix.length > 0) {
    console.log('\n5. Fixing processing_status for prime-picks products...');
    const updateStatus = db.prepare(`
      UPDATE unified_content 
      SET processing_status = 'active'
      WHERE display_pages LIKE '%prime-picks%'
      AND (processing_status IS NULL OR processing_status != 'active')
    `);
    
    const result = updateStatus.run();
    console.log(`   ✅ Updated ${result.changes} products to active status`);
    
    // Test API query again
    console.log('\n6. Testing API query after fix:');
    const fixedResults = db.prepare(apiQuery).all('prime-picks', 'prime-picks');
    console.log(`   API Query Results: ${fixedResults.length} products`);
    
    if (fixedResults.length > 0) {
      console.log('   ✅ Prime-picks should now work!');
      fixedResults.forEach(r => {
        console.log(`      ID ${r.id}: ${r.title}`);
      });
    }
  }
  
  // Check other pages that might have the same issue
  console.log('\n7. Checking other pages for similar issues:');
  const otherPages = ['value-picks', 'global-picks', 'deals-hub'];
  
  otherPages.forEach(page => {
    const pageProducts = db.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN processing_status = 'active' THEN 1 ELSE 0 END) as active
      FROM unified_content 
      WHERE display_pages LIKE '%' || ? || '%'
    `).get(page);
    
    console.log(`   ${page}: ${pageProducts.total} total, ${pageProducts.active} active`);
    
    if (pageProducts.total > pageProducts.active) {
      console.log(`      ⚠️ ${page} needs processing_status fix`);
    }
  });
  
  // Fix all pages at once
  console.log('\n8. Fixing processing_status for all pages...');
  const fixAllPages = db.prepare(`
    UPDATE unified_content 
    SET processing_status = 'active'
    WHERE processing_status IS NULL OR processing_status != 'active'
  `);
  
  const allFixResult = fixAllPages.run();
  console.log(`   ✅ Updated ${allFixResult.changes} products to active status`);
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}