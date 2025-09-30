const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('🔍 Debugging API Query Issues...');
console.log('==================================================\n');

try {
  // Test the exact query used by the API for different pages
  const testPages = ['prime-picks', 'value-picks', 'cue-picks', 'travel-picks'];
  
  testPages.forEach(page => {
    console.log(`🎯 Testing page: ${page}`);
    
    // This is the exact query from the API
    const apiQuery = `
      SELECT 
        id,
        name,
        description,
        price,
        original_price as originalPrice,
        currency,
        image_url as imageUrl,
        affiliate_url as affiliateUrl,
        category,
        rating,
        review_count as reviewCount,
        discount,
        is_new as isNew,
        is_featured as isFeatured,
        created_at as createdAt
      FROM products 
      WHERE JSON_EXTRACT(display_pages, '$') LIKE ?
      ORDER BY created_at DESC
    `;
    
    const searchPattern = `%"${page}"%`;
    console.log(`   Search pattern: ${searchPattern}`);
    
    const results = db.prepare(apiQuery).all(searchPattern);
    console.log(`   Results found: ${results.length}`);
    
    if (results.length > 0) {
      results.forEach(product => {
        console.log(`      - ${product.name} (ID: ${product.id})`);
      });
    }
    
    // Also check what display_pages values exist for this page
    const displayPagesCheck = db.prepare(`
      SELECT id, name, display_pages 
      FROM products 
      WHERE display_pages LIKE ?
    `).all(`%${page}%`);
    
    console.log(`   Display pages containing "${page}": ${displayPagesCheck.length}`);
    displayPagesCheck.forEach(product => {
      console.log(`      - ${product.name}: ${product.display_pages}`);
    });
    
    console.log('');
  });

  // Show all products and their display_pages
  console.log('📊 All Products and Display Pages:');
  const allProducts = db.prepare(`
    SELECT id, name, display_pages, created_at 
    FROM products 
    ORDER BY created_at DESC
  `).all();
  
  allProducts.forEach(product => {
    console.log(`   ID ${product.id}: ${product.name}`);
    console.log(`      Display Pages: ${product.display_pages}`);
    console.log(`      Created: ${new Date(product.created_at * 1000).toISOString()}\n`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}