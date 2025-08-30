const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Adding test crawled products to database...');

try {
  // Sample crawled products to add
  const crawledProducts = [
    {
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Latest Samsung flagship smartphone with S Pen - Discovered via Amazon crawl',
      price: 124999,
      original_price: 134999,
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      affiliate_url: 'https://amazon.in/samsung-galaxy-s24?tag=pickntrust03-21',
      category: 'Electronics',
      rating: 4.5,
      review_count: 1250,
      is_featured: 1,
      affiliateProgram: 'amazon_associates',
      merchantDomain: 'amazon.in',
      originalUrl: 'https://amazon.in/samsung-galaxy-s24-ultra',
      commissionRate: '8%',
      tags: 'crawled,amazon,smartphone,flagship',
      targetPage: 'top-picks'
    },
    {
      name: 'Apple MacBook Pro M3',
      description: 'Powerful laptop with M3 chip for professionals - Auto-discovered from Amazon',
      price: 199900,
      original_price: 219900,
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      affiliate_url: 'https://amazon.in/macbook-pro-m3?tag=pickntrust03-21',
      category: 'Electronics',
      rating: 4.8,
      review_count: 890,
      is_featured: 1,
      affiliateProgram: 'amazon_associates',
      merchantDomain: 'amazon.in',
      originalUrl: 'https://amazon.in/macbook-pro-m3',
      commissionRate: '8%',
      tags: 'crawled,amazon,laptop,apple',
      targetPage: 'top-picks'
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      description: 'Industry-leading noise cancellation headphones - Crawled from Amazon',
      price: 29990,
      original_price: 34990,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      affiliate_url: 'https://amazon.in/sony-wh1000xm5?tag=pickntrust03-21',
      category: 'Electronics',
      rating: 4.6,
      review_count: 2100,
      is_featured: 1,
      affiliateProgram: 'amazon_associates',
      merchantDomain: 'amazon.in',
      originalUrl: 'https://amazon.in/sony-wh1000xm5',
      commissionRate: '8%',
      tags: 'crawled,amazon,headphones,audio',
      targetPage: 'top-picks'
    },
    {
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with Air Max technology - Discovered via website crawl',
      price: 12995,
      original_price: 15995,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      affiliate_url: 'https://myntra.com/nike-air-max-270?utm_source=pickntrust',
      category: 'Fashion',
      rating: 4.3,
      review_count: 850,
      is_featured: 1,
      affiliateProgram: 'myntra_affiliate',
      merchantDomain: 'myntra.com',
      originalUrl: 'https://myntra.com/nike-air-max-270',
      commissionRate: '12%',
      tags: 'crawled,myntra,shoes,nike',
      targetPage: 'top-picks'
    },
    {
      name: 'Philips Air Fryer HD9252',
      description: 'Healthy cooking with Rapid Air technology - Auto-crawled from Flipkart',
      price: 8999,
      original_price: 12999,
      image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      affiliate_url: 'https://flipkart.com/philips-air-fryer?affid=pickntrust',
      category: 'Home & Kitchen',
      rating: 4.4,
      review_count: 1500,
      is_featured: 1,
      affiliateProgram: 'flipkart_affiliate',
      merchantDomain: 'flipkart.com',
      originalUrl: 'https://flipkart.com/philips-air-fryer-hd9252',
      commissionRate: '6%',
      tags: 'crawled,flipkart,kitchen,appliance',
      targetPage: 'top-picks'
    }
  ];

  // Insert products using correct column names
  const insertStmt = db.prepare(`
    INSERT INTO products (
      name, description, price, original_price, image_url, affiliate_url,
      category, rating, review_count, is_featured, affiliateProgram,
      merchantDomain, originalUrl, commissionRate, tags, targetPage, isActive
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, 1
    )
  `);

  let addedCount = 0;
  
  for (const product of crawledProducts) {
    try {
      const result = insertStmt.run(
        product.name,
        product.description,
        product.price,
        product.original_price,
        product.image_url,
        product.affiliate_url,
        product.category,
        product.rating,
        product.review_count,
        product.is_featured,
        product.affiliateProgram,
        product.merchantDomain,
        product.originalUrl,
        product.commissionRate,
        product.tags,
        product.targetPage
      );
      
      console.log(`✅ Added: ${product.name} (ID: ${result.lastInsertRowid})`);
      addedCount++;
    } catch (error) {
      console.log(`⚠️ Skipped: ${product.name} (${error.message})`);
    }
  }

  console.log(`\n🎊 Successfully added ${addedCount} crawled products to database!`);
  
  // Show current product count
  const countResult = db.prepare('SELECT COUNT(*) as count FROM products WHERE isActive = 1').get();
  console.log(`📊 Total active products in database: ${countResult.count}`);
  
  // Show featured products count
  const featuredResult = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_featured = 1 AND isActive = 1').get();
  console.log(`⭐ Featured products: ${featuredResult.count}`);
  
  // Show products by category
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM products 
    WHERE isActive = 1 
    GROUP BY category
  `).all();
  
  console.log('\n📋 Products by category:');
  categoryStats.forEach(stat => {
    console.log(`   ${stat.category}: ${stat.count} products`);
  });
  
  // Show crawled products specifically
  const crawledStats = db.prepare(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE tags LIKE '%crawled%' AND isActive = 1
  `).get();
  
  console.log(`\n🕷️ Crawled products: ${crawledStats.count}`);
  
} catch (error) {
  console.error('❌ Error adding products:', error);
} finally {
  db.close();
}

console.log('\n🚀 Crawled products added! Check your website at http://localhost:5000');
console.log('💡 These products simulate what the website crawler discovers automatically.');
console.log('🎯 They should now appear in the "Today\'s Top Picks" section!');