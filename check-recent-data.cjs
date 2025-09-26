const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

console.log('🔍 Checking recent database activity...\n');

try {
  console.log('📊 Recent channel_posts (last 30 minutes):');
  const posts = db.prepare(`
    SELECT * FROM channel_posts 
    WHERE created_at > datetime('now', '-30 minutes') 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  if (posts.length > 0) {
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ID: ${post.id}, Channel: ${post.channel_id}, Created: ${post.created_at}`);
      console.log(`   Text: ${post.original_text?.substring(0, 100)}...`);
    });
  } else {
    console.log('   No recent channel posts found');
  }
  
  console.log('\n📦 Recent unified_content (last 30 minutes):');
  const products = db.prepare(`
    SELECT * FROM unified_content 
    WHERE created_at > datetime('now', '-30 minutes') 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  if (products.length > 0) {
    products.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}, Title: ${product.title}`);
      console.log(`   Page: ${product.display_pages}, Created: ${product.created_at}`);
    });
  } else {
    console.log('   No recent products found');
  }
  
  console.log('\n📈 Total counts:');
  const totalPosts = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
  console.log(`   Total channel_posts: ${totalPosts.count}`);
  console.log(`   Total unified_content: ${totalProducts.count}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}