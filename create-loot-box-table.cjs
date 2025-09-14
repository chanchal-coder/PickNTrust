// Create Loot Box Products Table
const Database = require('better-sqlite3');

console.log('Gift Creating Loot Box Products Table...');

try {
  const db = new Database('database.sqlite');
  
  console.log('\n1. 📋 Creating loot_box_products table...');
  
  // Create loot_box_products table (similar to prime_picks_products)
  const createLootBoxTable = `
    CREATE TABLE IF NOT EXISTS loot_box_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      original_price TEXT,
      currency TEXT DEFAULT 'INR',
      image_url TEXT,
      affiliate_url TEXT NOT NULL,
      original_url TEXT,
      category TEXT DEFAULT 'General',
      rating REAL DEFAULT 4.5,
      review_count INTEGER DEFAULT 100,
      discount INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      affiliate_network TEXT DEFAULT 'Amazon',
      telegram_message_id INTEGER,
      telegram_channel_id INTEGER,
      telegram_channel_name TEXT DEFAULT 'Loot Box',
      processing_status TEXT DEFAULT 'active',
      content_type TEXT DEFAULT 'product',
      affiliate_tag_applied INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  db.exec(createLootBoxTable);
  console.log('Success loot_box_products table created successfully');
  
  console.log('\n2. Stats Adding sample loot box products...');
  
  // Insert sample loot box products
  const insertSampleProducts = db.prepare(`
    INSERT INTO loot_box_products (
      name, description, price, original_price, image_url, affiliate_url, original_url,
      category, rating, review_count, discount, is_featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const sampleProducts = [
    {
      name: 'Mystery Gaming Bundle - Surprise Electronics Pack',
      description: 'Exciting mystery box containing gaming accessories, electronics, and surprise gadgets worth up to ₹5000',
      price: '999',
      original_price: '2999',
      image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop&q=80',
      affiliate_url: 'https://amazon.in/dp/mystery-gaming-bundle',
      original_url: 'https://amazon.in/dp/mystery-gaming-bundle',
      category: 'Gaming',
      rating: 4.7,
      review_count: 245,
      discount: 67,
      is_featured: 1
    },
    {
      name: 'Tech Surprise Box - Random Gadgets Collection',
      description: 'Curated collection of tech gadgets, accessories, and electronic items. Perfect for tech enthusiasts!',
      price: '1499',
      original_price: '3999',
      image_url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop&q=80',
      affiliate_url: 'https://amazon.in/dp/tech-surprise-box',
      original_url: 'https://amazon.in/dp/tech-surprise-box',
      category: 'Electronics',
      rating: 4.5,
      review_count: 189,
      discount: 62,
      is_featured: 1
    },
    {
      name: 'Fashion Mystery Box - Clothing & Accessories',
      description: 'Surprise fashion items including clothing, accessories, and style essentials for men and women',
      price: '799',
      original_price: '2499',
      image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&q=80',
      affiliate_url: 'https://amazon.in/dp/fashion-mystery-box',
      original_url: 'https://amazon.in/dp/fashion-mystery-box',
      category: 'Fashion',
      rating: 4.3,
      review_count: 156,
      discount: 68,
      is_featured: 0
    },
    {
      name: 'Home & Kitchen Surprise Bundle',
      description: 'Amazing collection of home essentials, kitchen gadgets, and household items worth much more!',
      price: '1299',
      original_price: '3499',
      image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      affiliate_url: 'https://amazon.in/dp/home-kitchen-bundle',
      original_url: 'https://amazon.in/dp/home-kitchen-bundle',
      category: 'Home & Kitchen',
      rating: 4.6,
      review_count: 203,
      discount: 63,
      is_featured: 1
    },
    {
      name: 'Beauty & Personal Care Mystery Box',
      description: 'Surprise beauty products, skincare items, and personal care essentials from top brands',
      price: '899',
      original_price: '2799',
      image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&q=80',
      affiliate_url: 'https://amazon.in/dp/beauty-mystery-box',
      original_url: 'https://amazon.in/dp/beauty-mystery-box',
      category: 'Beauty',
      rating: 4.4,
      review_count: 178,
      discount: 68,
      is_featured: 0
    },
    {
      name: 'Sports & Fitness Surprise Pack',
      description: 'Exciting sports equipment, fitness accessories, and workout gear for active lifestyle enthusiasts',
      price: '1199',
      original_price: '3299',
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&q=80',
      affiliate_url: 'https://amazon.in/dp/sports-fitness-pack',
      original_url: 'https://amazon.in/dp/sports-fitness-pack',
      category: 'Sports',
      rating: 4.5,
      review_count: 167,
      discount: 64,
      is_featured: 0
    }
  ];
  
  sampleProducts.forEach(product => {
    insertSampleProducts.run(
      product.name,
      product.description,
      product.price,
      product.original_price,
      product.image_url,
      product.affiliate_url,
      product.original_url,
      product.category,
      product.rating,
      product.review_count,
      product.discount,
      product.is_featured
    );
  });
  
  console.log(`Success Added ${sampleProducts.length} sample loot box products`);
  
  console.log('\n3. Stats Verifying table structure...');
  
  // Verify table structure
  const tableInfo = db.prepare("PRAGMA table_info(loot_box_products)").all();
  console.log('\n📋 Table columns:');
  tableInfo.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : ''}`);
  });
  
  // Check inserted data
  const productCount = db.prepare("SELECT COUNT(*) as count FROM loot_box_products").get();
  console.log(`\nProducts Total loot box products: ${productCount.count}`);
  
  // Show sample products
  const sampleData = db.prepare(`
    SELECT id, name, price, original_price, discount, category, is_featured 
    FROM loot_box_products 
    ORDER BY created_at DESC 
    LIMIT 3
  `).all();
  
  console.log('\nGift Sample loot box products:');
  sampleData.forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.name}`);
    console.log(`      Price: ₹${product.price} (was ₹${product.original_price})`);
    console.log(`      Discount: ${product.discount}% | Category: ${product.category}`);
    console.log(`      Featured: ${product.is_featured ? 'Yes' : 'No'}`);
  });
  
  db.close();
  
  console.log('\nSuccess LOOT BOX DATABASE SETUP COMPLETED!');
  console.log('Target Ready for backend API integration');
  console.log('AI Ready for Telegram bot setup');
  console.log('Global Ready for frontend implementation');
  
} catch (error) {
  console.error('Error Error creating loot box table:', error.message);
}