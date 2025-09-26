const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('🔍 Checking Telegram Posts and Product Integration...');
console.log('==================================================\n');

try {
  // Check channel_posts table
  console.log('📱 Channel Posts:');
  const posts = db.prepare(`
    SELECT id, message_id, channel_id, channel_name, original_text, website_page, created_at 
    FROM channel_posts 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  if (posts.length === 0) {
    console.log('   No posts found in channel_posts table');
  } else {
    posts.forEach(post => {
      console.log(`   ID ${post.id}: Message ${post.message_id}`);
      console.log(`      Channel: ${post.channel_name} (${post.channel_id})`);
      console.log(`      Website Page: ${post.website_page}`);
      console.log(`      Content: ${post.original_text ? post.original_text.substring(0, 100) + '...' : 'null'}`);
      console.log(`      Created: ${post.created_at}\n`);
    });
  }

  // Check if any products are linked to telegram posts
  console.log('🔗 Products linked to Telegram:');
  const linkedProducts = db.prepare(`
    SELECT id, name, source, display_pages 
    FROM products 
    WHERE source IS NOT NULL
  `).all();
  
  if (linkedProducts.length === 0) {
    console.log('   No products linked to Telegram posts');
  } else {
    linkedProducts.forEach(product => {
      console.log(`   ID ${product.id}: ${product.name}`);
      console.log(`      Source: ${product.source}`);
      console.log(`      Display Pages: ${product.display_pages}\n`);
    });
  }

  // Check for products that should be on specific pages
  console.log('📊 Products by Display Pages:');
  const pageStats = db.prepare(`
    SELECT display_pages, COUNT(*) as count 
    FROM products 
    GROUP BY display_pages
  `).all();
  
  pageStats.forEach(stat => {
    console.log(`   ${stat.display_pages}: ${stat.count} products`);
  });

  // Check what pages we should have products for
  console.log('\n🎯 Expected Pages from Channel Posts:');
  const expectedPages = db.prepare(`
    SELECT DISTINCT website_page, COUNT(*) as post_count 
    FROM channel_posts 
    WHERE website_page IS NOT NULL 
    GROUP BY website_page
  `).all();
  
  if (expectedPages.length === 0) {
    console.log('   No website_page mappings found in channel_posts');
  } else {
    expectedPages.forEach(page => {
      console.log(`   ${page.website_page}: ${page.post_count} posts`);
    });
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}