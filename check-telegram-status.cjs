const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Search Checking telegram_products table status...');

try {
  const currentTime = Math.floor(Date.now() / 1000);
  console.log('Current timestamp:', currentTime);
  console.log('Current time:', new Date().toLocaleString());
  
  // Get all products
  const allProducts = db.prepare('SELECT id, name, expires_at, created_at FROM telegram_products ORDER BY created_at DESC').all();
  console.log('\n📋 All Telegram products:', allProducts.length);
  
  allProducts.forEach((p, i) => {
    console.log(`${i+1}. ID: ${p.id}`);
    console.log(`   Name: ${p.name.substring(0, 60)}...`);
    console.log(`   Expires: ${p.expires_at} (${new Date(p.expires_at * 1000).toLocaleString()})`);
    console.log(`   Created: ${p.created_at} (${new Date(p.created_at * 1000).toLocaleString()})`);
    console.log(`   Status: ${p.expires_at < currentTime ? 'Error EXPIRED' : 'Success ACTIVE'}`);
    console.log('');
  });
  
  // Get active products
  const activeProducts = db.prepare('SELECT * FROM telegram_products WHERE expires_at > ? OR expires_at IS NULL').all(currentTime);
  console.log('Success Active products:', activeProducts.length);
  
  if (activeProducts.length > 0) {
    console.log('\n📋 Active product details:');
    activeProducts.forEach(ap => {
      console.log(`   - ${ap.name} (ID: ${ap.id})`);
    });
  }
  
  // Test the exact query used in the API
  console.log('\nSearch Testing API query...');
  const apiQuery = `
    SELECT 
      id, name, description, price, original_price as originalPrice,
      currency, image_url as imageUrl, affiliate_url as affiliateUrl,
      category, rating, review_count as reviewCount, discount,
      is_featured as isFeatured, created_at as createdAt
    FROM telegram_products 
    WHERE expires_at > ? OR expires_at IS NULL
    ORDER BY created_at DESC
  `;
  
  const apiResults = db.prepare(apiQuery).all(currentTime);
  console.log('API query results:', apiResults.length);
  
  if (apiResults.length > 0) {
    console.log('\n📋 API query sample:');
    console.log(JSON.stringify(apiResults[0], null, 2));
  }
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}