const Database = require('better-sqlite3');
const path = require('path');

async function checkDatabase() {
  console.log('🔍 Checking Database for Products with Price Data\n');
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Check unified_content table for products with prices
    console.log('📊 Products with Price Data:');
    const productsWithPrices = db.prepare(`
      SELECT id, title, price, original_price, discount, created_at 
      FROM unified_content 
      WHERE price IS NOT NULL AND price != '' AND price != '0'
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    if (productsWithPrices.length > 0) {
      console.log(`Found ${productsWithPrices.length} products with prices:`);
      productsWithPrices.forEach(product => {
        console.log(`  ID: ${product.id} | Title: ${product.title?.substring(0, 50)}... | Price: ${product.price} | Original: ${product.original_price || 'N/A'} | Discount: ${product.discount || 'N/A'}%`);
      });
    } else {
      console.log('❌ No products found with price data');
    }
    
    console.log('\n📊 All Products (Recent):');
    const allProducts = db.prepare(`
      SELECT id, title, price, original_price, discount, created_at 
      FROM unified_content 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    if (allProducts.length > 0) {
      console.log(`Found ${allProducts.length} recent products:`);
      allProducts.forEach(product => {
        console.log(`  ID: ${product.id} | Title: ${product.title?.substring(0, 50)}... | Price: ${product.price || 'N/A'} | Original: ${product.original_price || 'N/A'} | Discount: ${product.discount || 'N/A'}%`);
      });
    } else {
      console.log('❌ No products found in unified_content table');
    }
    
    console.log('\n📊 Channel Posts Status:');
    const channelPosts = db.prepare(`
      SELECT id, original_text, is_processed, created_at 
      FROM channel_posts 
      WHERE original_text IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    if (channelPosts.length > 0) {
      console.log(`Found ${channelPosts.length} channel posts:`);
      channelPosts.forEach(post => {
        console.log(`  ID: ${post.id} | Processed: ${post.is_processed ? 'Yes' : 'No'} | Text: ${post.original_text?.substring(0, 80)}...`);
      });
    } else {
      console.log('❌ No channel posts found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    db.close();
  }
}

checkDatabase().catch(console.error);