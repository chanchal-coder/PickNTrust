const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

console.log('🔧 Fixing Prime Picks Test Products...');

// Test products for Prime Picks with correct column names
const primePicksProducts = [
  {
    name: '⭐ FEATURED MacBook Air M3 - Editor\'s Choice',
    description: 'Featured MacBook Air with M3 chip, our editor\'s top pick for 2024. Highly recommended!',
    price: '114900',
    original_price: '119900',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    affiliate_url: 'https://amazon.in/dp/B0CMDRCG8G?tag=pickntrust03-21',
    category: 'Electronics & Gadgets',
    rating: '4.9',
    review_count: 2100,
    discount: 4,
    source: 'prime-picks-test',
    is_new: 1,         // Success This product will show "NEW" badge
    is_featured: 1,    // Success This product will show "FEATURED" badge
    display_pages: JSON.stringify(['prime-picks']),
    created_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    name: 'Standard Gaming Laptop - ASUS ROG Strix',
    description: 'High-performance gaming laptop with RTX 4060. Standard product without special badges.',
    price: '89999',
    original_price: '99999',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80',
    affiliate_url: 'https://amazon.in/dp/B0C7CGQKJM?tag=pickntrust03-21',
    category: 'Electronics & Gadgets',
    rating: '4.5',
    review_count: 756,
    discount: 10,
    source: 'prime-picks-test',
    is_new: 0,         // Error This product will NOT show "NEW" badge
    is_featured: 0,    // Error This product will NOT show "FEATURED" badge
    display_pages: JSON.stringify(['prime-picks']),
    created_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
];

console.log('\n1. Adding Prime Picks test products with correct schema...');

// Insert Prime Picks products with correct column names
const insertPrimePicksQuery = `
  INSERT INTO products (
    name, description, price, original_price, currency, image_url,
    affiliate_url, category, rating, review_count, discount, source,
    is_new, is_featured, display_pages, created_at, expires_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

let primePicksInserted = 0;
primePicksProducts.forEach((product, index) => {
  db.run(insertPrimePicksQuery, [
    product.name, product.description, product.price, product.original_price,
    product.currency, product.image_url, product.affiliate_url, product.category,
    product.rating, product.review_count, product.discount, product.source,
    product.is_new, product.is_featured, product.display_pages,
    product.created_at, product.expires_at
  ], function(err) {
    if (err) {
      console.error(`Error Error inserting Prime Picks product ${index + 1}:`, err.message);
    } else {
      primePicksInserted++;
      const badges = [];
      if (product.is_new === 1) badges.push('NEW');
      if (product.is_featured === 1) badges.push('FEATURED');
      console.log(`Success Prime Picks Product ${index + 1} added (ID: ${this.lastID})`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Badges: ${badges.length > 0 ? badges.join(', ') : 'None'}`);
      console.log(`   Discount: ${product.discount}%`);
    }
    
    if (primePicksInserted === primePicksProducts.length) {
      verifyAllTestProducts();
    }
  });
});

function verifyAllTestProducts() {
  console.log('\n2. Verifying all test products...');
  
  // Check Cue Picks products
  db.all('SELECT id, name, is_new, is_featured, discount FROM products WHERE source = "cue-picks-test" ORDER BY id DESC', (err, cueRows) => {
    if (err) {
      console.error('Error checking Cue Picks test products:', err.message);
    } else {
      console.log('\nStats Cue Picks Test Products:');
      cueRows.forEach(row => {
        const badges = [];
        if (row.is_new === 1) badges.push('NEW');
        if (row.is_featured === 1) badges.push('FEATURED');
        console.log(`   ID ${row.id}: ${badges.length > 0 ? badges.join(', ') : 'No badges'} | ${row.discount}% OFF`);
      });
    }
    
    // Check Prime Picks products
    db.all('SELECT id, name, is_new, is_featured, discount FROM products WHERE source = "prime-picks-test" ORDER BY id DESC', (err, primeRows) => {
      if (err) {
        console.error('Error checking Prime Picks test products:', err.message);
      } else {
        console.log('\nStats Prime Picks Test Products:');
        primeRows.forEach(row => {
          const badges = [];
          if (row.is_new === 1) badges.push('NEW');
          if (row.is_featured === 1) badges.push('FEATURED');
          console.log(`   ID ${row.id}: ${badges.length > 0 ? badges.join(', ') : 'No badges'} | ${row.discount}% OFF`);
        });
      }
      
      console.log('\nTarget Complete Test Summary:');
      console.log('Success Cue Picks: 2 products added (1 with NEW+FEATURED, 1 without badges)');
      console.log('Success Prime Picks: 2 products added (1 with NEW+FEATURED, 1 without badges)');
      console.log('Success All products have discount data for testing');
      console.log('\n🧪 Expected Results:');
      console.log('Mobile Cue Picks Page:');
      console.log('   - Samsung Galaxy S24: Should show RED "NEW" + "FEATURED" badges + discount');
      console.log('   - Sony Headphones: Should show ONLY discount badge (no NEW/FEATURED)');
      console.log('💻 Prime Picks Page:');
      console.log('   - MacBook Air M3: Should show RED "NEW" + "FEATURED" badges + discount');
      console.log('   - ASUS Gaming Laptop: Should show ONLY discount badge (no NEW/FEATURED)');
      console.log('\nGlobal Test URLs:');
      console.log('1. http://localhost:5000/cue-picks');
      console.log('2. http://localhost:5000/prime-picks');
      
      db.close();
    });
  });
}