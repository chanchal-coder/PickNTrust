const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

console.log('🔍 Bot Activity Monitor Started');
console.log('📊 Monitoring for new products...');
console.log('💡 Send a message with a product URL to one of the monitored Telegram channels');
console.log('');

// Get initial count
let lastCount = 0;
try {
  const result = db.prepare('SELECT COUNT(*) as count FROM products').get();
  lastCount = result.count;
  console.log(`📈 Current products in database: ${lastCount}`);
} catch (error) {
  console.log('❌ Error reading database:', error.message);
  process.exit(1);
}

// Monitor for changes every 2 seconds
setInterval(() => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM products').get();
    const currentCount = result.count;
    
    if (currentCount > lastCount) {
      console.log(`🎉 NEW PRODUCT DETECTED! Count increased from ${lastCount} to ${currentCount}`);
      
      // Get the latest product
      const latestProduct = db.prepare(`
        SELECT id, name, price, affiliate_url, source, created_at, display_pages
        FROM products 
        ORDER BY created_at DESC 
        LIMIT 1
      `).get();
      
      if (latestProduct) {
        console.log('📦 Latest Product Details:');
        console.log(`   ID: ${latestProduct.id}`);
        console.log(`   Name: ${latestProduct.name}`);
        console.log(`   Price: ${latestProduct.price}`);
        console.log(`   Source: ${latestProduct.source}`);
        console.log(`   Display Pages: ${latestProduct.display_pages}`);
        console.log(`   Created: ${new Date(latestProduct.created_at * 1000).toLocaleString()}`);
        console.log('');
      }
      
      lastCount = currentCount;
    }
  } catch (error) {
    console.log('❌ Error monitoring database:', error.message);
  }
}, 2000);

console.log('⏰ Checking every 2 seconds for new products...');
console.log('🛑 Press Ctrl+C to stop monitoring');