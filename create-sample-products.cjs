const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🛍️ Creating Sample Products for Different Pages...');
console.log('==================================================\n');

try {
  // Sample products for different pages
  const sampleProducts = [
    {
      name: "Amazon Echo Dot (5th Gen)",
      description: "Smart speaker with Alexa - Charcoal",
      price: 4999,
      currency: "INR",
      image_url: "https://m.media-amazon.com/images/I/714Rdc+OjjL._AC_SL1500_.jpg",
      affiliate_url: "https://amazon.in/dp/B09B8V1LZ3?tag=pickntrust03-21",
      category: "Electronics",
      display_pages: '["prime-picks"]',
      source: "amazon",
      affiliate_network: "amazon"
    },
    {
      name: "Boat Airdopes 141 Bluetooth Earbuds",
      description: "True Wireless Earbuds with 42H Playtime",
      price: 1299,
      currency: "INR", 
      image_url: "https://cdn.shopify.com/s/files/1/0057/8938/4802/products/141-black_600x.png",
      affiliate_url: "https://amazon.in/dp/B08ZJ2THF5?tag=pickntrust03-21",
      category: "Electronics",
      display_pages: '["prime-picks"]',
      source: "amazon",
      affiliate_network: "amazon"
    },
    {
      name: "Xiaomi Mi Band 7",
      description: "Smart Fitness Band with 1.62 AMOLED Display",
      price: 2799,
      currency: "INR",
      image_url: "https://i01.appmifile.com/webfile/globalimg/products/pc/mi-smart-band-7/specs01.jpg",
      affiliate_url: "https://amazon.in/dp/B0B3QZXB8K?tag=pickntrust03-21",
      category: "Fitness",
      display_pages: '["value-picks"]',
      source: "amazon",
      affiliate_network: "amazon"
    },
    {
      name: "Philips Air Fryer HD9252/90",
      description: "Digital Air Fryer with Rapid Air Technology - 4.1L",
      price: 8995,
      currency: "INR",
      image_url: "https://images.philips.com/is/image/PhilipsConsumer/HD9252_90-KA1-global-001",
      affiliate_url: "https://amazon.in/dp/B077GBQZPX?tag=pickntrust03-21",
      category: "Kitchen",
      display_pages: '["value-picks"]',
      source: "amazon",
      affiliate_network: "amazon"
    },
    {
      name: "Cue Picks Special: Gaming Mouse",
      description: "High-precision gaming mouse with RGB lighting",
      price: 1999,
      currency: "INR",
      image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500",
      affiliate_url: "https://amazon.in/dp/B08GAMING?tag=pickntrust03-21",
      category: "Gaming",
      display_pages: '["cue-picks"]',
      source: "curated",
      affiliate_network: "amazon"
    },
    {
      name: "Travel Essential: Portable Charger",
      description: "20000mAh Power Bank with Fast Charging",
      price: 2499,
      currency: "INR",
      image_url: "https://images.unsplash.com/photo-1609592806596-b43bada2e3c9?w=500",
      affiliate_url: "https://amazon.in/dp/B08TRAVEL?tag=pickntrust03-21",
      category: "Travel",
      display_pages: '["travel-picks"]',
      source: "curated",
      affiliate_network: "amazon"
    }
  ];

  // Insert sample products
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, price, currency, image_url, affiliate_url, 
      category, display_pages, source, rating, review_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Math.floor(Date.now() / 1000);
  
  sampleProducts.forEach(product => {
    try {
      insertProduct.run(
        product.name,
        product.description,
        product.price,
        product.currency,
        product.image_url,
        product.affiliate_url,
        product.category,
        product.display_pages,
        product.source,
        4.5, // Default rating
        150, // Default review count
        now,
        now
      );
      console.log(`✅ Added: ${product.name} -> ${product.display_pages}`);
    } catch (error) {
      console.log(`❌ Failed to add ${product.name}: ${error.message}`);
    }
  });

  // Show final distribution
  console.log('\n📊 Final Product Distribution:');
  const distribution = db.prepare(`
    SELECT display_pages, COUNT(*) as count 
    FROM products 
    GROUP BY display_pages
  `).all();
  
  distribution.forEach(item => {
    console.log(`   ${item.display_pages}: ${item.count} products`);
  });

  console.log('\n🎉 Sample products created successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}