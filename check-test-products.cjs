const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('=== CHECKING TEST PRODUCTS IN DATABASE ===\n');

try {
  // Check all products in unified_content
  const allProducts = db.prepare(`
    SELECT id, title, category, is_featured, is_service, is_ai_app, display_pages, visibility, processing_status, status
    FROM unified_content 
    ORDER BY id DESC
  `).all();

  console.log(`Total products in unified_content: ${allProducts.length}\n`);

  if (allProducts.length === 0) {
    console.log('❌ NO PRODUCTS FOUND IN DATABASE!');
    console.log('The test products were not inserted properly.\n');
  } else {
    console.log('📋 ALL PRODUCTS:');
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}`);
      console.log(`   Title: ${product.title}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Featured: ${product.is_featured ? '✅' : '❌'}`);
      console.log(`   Service: ${product.is_service ? '✅' : '❌'}`);
      console.log(`   AI App: ${product.is_ai_app ? '✅' : '❌'}`);
      console.log(`   Display Pages: ${product.display_pages || 'null'}`);
      console.log(`   Visibility: ${product.visibility || 'null'}`);
      console.log(`   Processing Status: ${product.processing_status || 'null'}`);
      console.log(`   Status: ${product.status || 'null'}`);
      console.log('');
    });
  }

  // Check specifically for test products (recent ones)
  const recentProducts = db.prepare(`
    SELECT * FROM unified_content 
    WHERE title LIKE '%Test%' OR title LIKE '%Netflix%' OR title LIKE '%Spotify%' OR title LIKE '%ChatGPT%'
    ORDER BY id DESC
  `).all();

  if (recentProducts.length > 0) {
    console.log('🧪 TEST PRODUCTS FOUND:');
    recentProducts.forEach(product => {
      console.log(`- ${product.title} (ID: ${product.id})`);
      console.log(`  Featured: ${product.is_featured}, Service: ${product.is_service}, AI App: ${product.is_ai_app}`);
      console.log(`  Display Pages: ${product.display_pages}`);
      console.log(`  Visibility: ${product.visibility}, Status: ${product.processing_status}`);
    });
  } else {
    console.log('❌ NO TEST PRODUCTS FOUND!');
  }

  // Check for products that should appear on specific pages
  console.log('\n=== PRODUCTS BY PAGE TYPE ===');
  
  const featuredProducts = db.prepare(`
    SELECT id, title FROM unified_content 
    WHERE is_featured = 1 AND (visibility = 'public' OR visibility IS NULL) AND (status = 'published' OR status IS NULL)
  `).all();
  console.log(`Featured Products (top-picks): ${featuredProducts.length}`);
  featuredProducts.forEach(p => console.log(`  - ${p.title} (ID: ${p.id})`));

  const serviceProducts = db.prepare(`
    SELECT id, title FROM unified_content 
    WHERE is_service = 1 AND (visibility = 'public' OR visibility IS NULL) AND (status = 'published' OR status IS NULL)
  `).all();
  console.log(`\nService Products: ${serviceProducts.length}`);
  serviceProducts.forEach(p => console.log(`  - ${p.title} (ID: ${p.id})`));

  const aiAppProducts = db.prepare(`
    SELECT id, title FROM unified_content 
    WHERE is_ai_app = 1 AND (visibility = 'public' OR visibility IS NULL) AND (status = 'published' OR status IS NULL)
  `).all();
  console.log(`\nAI App Products: ${aiAppProducts.length}`);
  aiAppProducts.forEach(p => console.log(`  - ${p.title} (ID: ${p.id})`));

} catch (error) {
  console.error('❌ Error checking database:', error.message);
} finally {
  db.close();
}