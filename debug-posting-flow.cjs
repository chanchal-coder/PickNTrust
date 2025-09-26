const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Debugging Channel Post to Webpage Flow...');
console.log('==============================================\n');

try {
  // Step 1: Check channel_posts that are processed but not posted
  console.log('📋 Step 1: Channel Posts Status');
  const processedNotPosted = db.prepare(`
    SELECT id, channel_name, website_page, original_text, 
           is_processed, is_posted, processing_error, created_at
    FROM channel_posts 
    WHERE is_processed = 1 AND is_posted = 0
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  if (processedNotPosted.length === 0) {
    console.log('   ❌ No processed but unposted channel posts found');
  } else {
    console.log(`   ✅ Found ${processedNotPosted.length} processed but unposted posts:`);
    processedNotPosted.forEach(post => {
      console.log(`      ID ${post.id}: ${post.channel_name} -> ${post.website_page}`);
      console.log(`         Text: ${post.original_text?.substring(0, 80)}...`);
      console.log(`         Created: ${new Date(post.created_at).toLocaleString()}`);
    });
  }

  // Step 2: Check if products were created from these posts
  console.log('\n📦 Step 2: Products from Channel Posts');
  const recentProducts = db.prepare(`
    SELECT id, title, description, source_id, source_type, display_pages, created_at
    FROM unified_content 
    WHERE source_type = 'telegram' 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  if (recentProducts.length === 0) {
    console.log('   ❌ No products found with source_type = "telegram"');
    
    // Check if products exist in the products table instead
    const productsTable = db.prepare(`
      SELECT id, name, description, source, display_pages, created_at
      FROM products 
      WHERE source LIKE '%telegram%' OR source LIKE '%channel%'
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    if (productsTable.length > 0) {
      console.log('   ℹ️ Found products in "products" table instead:');
      productsTable.forEach(product => {
        console.log(`      ID ${product.id}: ${product.title || product.name}`);
        console.log(`         Source: ${product.source}`);
        console.log(`         Pages: ${product.display_pages}`);
      });
    }
  } else {
    console.log(`   ✅ Found ${recentProducts.length} products from Telegram:`);
    recentProducts.forEach(product => {
      console.log(`      ID ${product.id}: ${product.title}`);
      console.log(`         Source ID: ${product.source_id}`);
      console.log(`         Pages: ${product.display_pages}`);
      console.log(`         Created: ${new Date(product.created_at * 1000).toLocaleString()}`);
    });
  }

  // Step 3: Check API endpoints for each page
  console.log('\n🌐 Step 3: API Endpoint Data');
  const pages = ['prime-picks', 'value-picks', 'cue-picks', 'travel-picks'];
  
  for (const page of pages) {
    // Check unified_content table
    const unifiedProducts = db.prepare(`
      SELECT COUNT(*) as count
      FROM unified_content 
      WHERE JSON_EXTRACT(display_pages, '$[0]') = ? OR display_pages LIKE ?
    `).get(page, `%"${page}"%`);

    // Check products table
    const productsCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE JSON_EXTRACT(display_pages, '$[0]') = ? OR display_pages LIKE ?
    `).get(page, `%"${page}"%`);

    console.log(`   📄 ${page}:`);
    console.log(`      unified_content: ${unifiedProducts.count} products`);
    console.log(`      products: ${productsCount.count} products`);
  }

  // Step 4: Check which table the API actually uses
  console.log('\n🔍 Step 4: API Table Usage Analysis');
  console.log('   The API routes need to be checked to see which table they query.');
  console.log('   Based on our previous testing, the API returns products from the "products" table.');
  console.log('   But the Telegram bot is saving to "unified_content" table.');
  console.log('   This explains why channel posts are not appearing on webpages!');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}