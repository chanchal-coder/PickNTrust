// Comprehensive Bot Data Flow Check
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 COMPREHENSIVE BOT DATA FLOW CHECK');
console.log('=====================================\n');

try {
  // 1. Check unified_content table structure
  console.log('1. 📊 UNIFIED_CONTENT TABLE STRUCTURE:');
  const tableInfo = db.prepare('PRAGMA table_info(unified_content)').all();
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });

  // 2. Check recent products in unified_content
  console.log('\n2. 📦 RECENT PRODUCTS IN UNIFIED_CONTENT:');
  const recentProducts = db.prepare(`
    SELECT id, title, display_pages, source_platform, processing_status, created_at
    FROM unified_content 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  recentProducts.forEach(product => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`   ID: ${product.id} | ${product.title} | Pages: ${product.display_pages} | Source: ${product.source_platform} | Status: ${product.processing_status} | Created: ${createdDate}`);
  });

  // 3. Check prime-picks products specifically
  console.log('\n3. 🎯 PRIME-PICKS PRODUCTS:');
  const primePicksProducts = db.prepare(`
    SELECT id, title, display_pages, processing_status, created_at
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%' 
    ORDER BY created_at DESC
  `).all();

  console.log(`   Total prime-picks products: ${primePicksProducts.length}`);
  primePicksProducts.forEach(product => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`   ID: ${product.id} | ${product.title} | Status: ${product.processing_status} | Created: ${createdDate}`);
  });

  // 4. Check cue-picks products specifically
  console.log('\n4. 🎯 CUE-PICKS PRODUCTS:');
  const cuePicksProducts = db.prepare(`
    SELECT id, title, display_pages, processing_status, created_at
    FROM unified_content 
    WHERE display_pages LIKE '%cue-picks%' 
    ORDER BY created_at DESC
  `).all();

  console.log(`   Total cue-picks products: ${cuePicksProducts.length}`);
  cuePicksProducts.forEach(product => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`   ID: ${product.id} | ${product.title} | Status: ${product.processing_status} | Created: ${createdDate}`);
  });

  // 5. Check all distinct display_pages
  console.log('\n5. 📋 ALL DISTINCT DISPLAY_PAGES:');
  const distinctPages = db.prepare(`
    SELECT DISTINCT display_pages, COUNT(*) as count
    FROM unified_content 
    GROUP BY display_pages
    ORDER BY count DESC
  `).all();

  distinctPages.forEach(page => {
    console.log(`   ${page.display_pages}: ${page.count} products`);
  });

  // 6. Check channel_posts table for bot activity
  console.log('\n6. 📨 RECENT CHANNEL POSTS (Bot Activity):');
  try {
    const channelPosts = db.prepare(`
      SELECT id, channel_name, message_id, is_processed, is_posted, created_at
      FROM channel_posts 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    console.log(`   Total recent channel posts: ${channelPosts.length}`);
    channelPosts.forEach(post => {
      const createdDate = new Date(post.created_at * 1000).toLocaleString();
      console.log(`   ID: ${post.id} | Channel: ${post.channel_name} | Processed: ${post.is_processed} | Posted: ${post.is_posted} | Created: ${createdDate}`);
    });
  } catch (error) {
    console.log('   ❌ channel_posts table not found or error:', error.message);
  }

  // 7. Test API query simulation
  console.log('\n7. 🌐 API QUERY SIMULATION:');
  const apiQueryPrimePicks = `
    SELECT * FROM unified_content 
    WHERE display_pages LIKE '%' || ? || '%'
    AND processing_status = 'active'
    ORDER BY created_at DESC
  `;

  const apiResultsPrimePicks = db.prepare(apiQueryPrimePicks).all('prime-picks');
  console.log(`   Prime-picks API would return: ${apiResultsPrimePicks.length} products`);

  const apiResultsCuePicks = db.prepare(apiQueryPrimePicks).all('cue-picks');
  console.log(`   Cue-picks API would return: ${apiResultsCuePicks.length} products`);

  // 8. Check for products with source_platform = 'telegram'
  console.log('\n8. 📱 TELEGRAM SOURCE PRODUCTS:');
  const telegramProducts = db.prepare(`
    SELECT id, title, display_pages, source_platform, created_at
    FROM unified_content 
    WHERE source_platform = 'telegram'
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  console.log(`   Total telegram products: ${telegramProducts.length}`);
  telegramProducts.forEach(product => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`   ID: ${product.id} | ${product.title} | Pages: ${product.display_pages} | Created: ${createdDate}`);
  });

} catch (error) {
  console.error('❌ Database error:', error.message);
} finally {
  db.close();
  console.log('\n✅ Database check completed');
}