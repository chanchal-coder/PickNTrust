const Database = require('better-sqlite3');

console.log('🛒 Adding Tata Neu products directly to Click Picks...');

try {
  const db = new Database('database.sqlite');
  
  // First, check current products
  console.log('\n📋 Current Click Picks products:');
  const currentProducts = db.prepare(`
    SELECT id, name, image_url, affiliate_url, price 
    FROM click_picks_products 
    ORDER BY created_at DESC
  `).all();
  
  currentProducts.forEach(product => {
    console.log(`   - ID: ${product.id}, Name: ${product.name}`);
    console.log(`     Image: ${product.image_url}`);
    console.log(`     URL: ${product.affiliate_url}`);
    console.log('');
  });
  
  // Fix the existing product's image
  console.log('🔧 Fixing existing product image...');
  const updateExisting = db.prepare(`
    UPDATE click_picks_products 
    SET image_url = 'https://matrix.in/cdn/shop/files/Europe_eSIM_1.jpg?v=1703152847&width=400',
        name = 'Matrix Europe eSIM - Unlimited Data 5G/4G'
    WHERE id = 6
  `);
  updateExisting.run();
  console.log('Success Fixed existing product image and name');
  
  // Add Tata Neu products from the Telegram messages
  const tataNeuProducts = [
    {
      name: 'Tata Neu - Online Shopping for Grocery, Electronics, Fashion & More',
      description: 'Discover the ultimate online shopping experience at Tata Neu website. Order Groceries, Electronics, Clothing, Medicines, Food and also Book Flights & Hotels',
      price: '0', // Free service
      original_price: '0',
      currency: 'INR',
      image_url: 'https://logos-world.net/wp-content/uploads/2022/04/Tata-Neu-Logo.png',
      affiliate_url: 'https://www.tataneu.com/native-electronics/slp/mobiles',
      category: 'Shopping & Services',
      rating: '4.2',
      review_count: '50000',
      discount: '0',
      is_featured: 1,
      is_new: 1,
      affiliate_network: 'Tata Neu Direct',
      processing_status: 'active',
      source_metadata: JSON.stringify({ source: 'telegram', channel: 'click-picks', type: 'service' }),
      message_group_id: 'tata_neu_' + Date.now(),
      created_at: Math.floor(Date.now() / 1000)
    },
    {
      name: 'Tata Neu Mobile Shopping - Electronics & Smartphones',
      description: 'Shop for the latest smartphones, electronics, and mobile accessories on Tata Neu. Get exclusive deals, cashback offers, and fast delivery on all electronic items.',
      price: '0', // Free service
      original_price: '0',
      currency: 'INR',
      image_url: 'https://www.tataneu.com/assets/images/tata-neu-logo.svg',
      affiliate_url: 'https://www.tataneu.com/native-electronics/slp/mobiles',
      category: 'Electronics & Mobiles',
      rating: '4.3',
      review_count: '25000',
      discount: '0',
      is_featured: 1,
      is_new: 1,
      affiliate_network: 'Tata Neu Direct',
      processing_status: 'active',
      source_metadata: JSON.stringify({ source: 'telegram', channel: 'click-picks', type: 'service' }),
      message_group_id: 'tata_neu_mobile_' + Date.now(),
      created_at: Math.floor(Date.now() / 1000) + 1
    }
  ];
  
  console.log('\n🛒 Adding Tata Neu products...');
  
  const insertStmt = db.prepare(`
    INSERT INTO click_picks_products (
      name, description, price, original_price, currency, image_url, affiliate_url,
      category, rating, review_count, discount, is_featured, is_new, affiliate_network,
      processing_status, source_metadata, message_group_id, created_at
    ) VALUES (
      @name, @description, @price, @original_price, @currency, @image_url, @affiliate_url,
      @category, @rating, @review_count, @discount, @is_featured, @is_new, @affiliate_network,
      @processing_status, @source_metadata, @message_group_id, @created_at
    )
  `);
  
  tataNeuProducts.forEach((product, index) => {
    const result = insertStmt.run(product);
    console.log(`Success Added Tata Neu product ${index + 1} with ID: ${result.lastInsertRowid}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   URL: ${product.affiliate_url}`);
    console.log('');
  });
  
  // Verify all products
  console.log('\nSearch Final verification - All Click Picks products:');
  const allProducts = db.prepare(`
    SELECT id, name, price, image_url, processing_status 
    FROM click_picks_products 
    WHERE processing_status = 'active'
    ORDER BY created_at DESC
  `).all();
  
  console.log(`Success Total active products: ${allProducts.length}`);
  allProducts.forEach(product => {
    console.log(`   - ${product.name} (Price: ${product.price === '0' ? 'Free Service' : '₹' + product.price})`);
  });
  
  db.close();
  console.log('\nCelebration Successfully added Tata Neu products to Click Picks!');
  console.log('\nRefresh Check the website: http://localhost:5000/click-picks');
  
} catch (error) {
  console.error('Error Error adding Tata Neu products:', error);
  process.exit(1);
}