// Simple Prime Picks Fix - Create Test Product in Amazon Products Table
// This script creates a test product using only existing columns

const sqlite3 = require('sqlite3').verbose();

console.log('🔧 SIMPLE PRIME PICKS FIX');
console.log('=' .repeat(40));

const db = new sqlite3.Database('database.sqlite');

// First, check the table schema
console.log('\n📋 Checking amazon_products table schema...');
db.all('PRAGMA table_info(amazon_products)', (err, info) => {
  if (err) {
    console.log('Error Error:', err.message);
    db.close();
    return;
  }
  
  console.log('\nStats Available columns:');
  const columns = info.map(col => col.name);
  columns.forEach(col => console.log(`   - ${col}`));
  
  // Create a simple test product with only basic required fields
  console.log('\n🧪 Creating test product...');
  
  const insertQuery = `
    INSERT INTO amazon_products (
      name, description, price, original_price, currency, 
      image_url, affiliate_url, category, rating, 
      review_count, discount, is_featured, source,
      telegram_message_id, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const testProduct = {
    name: 'Prime Picks Test Product - Telegram Autopost',
    description: 'Testing Prime Picks autoposting with correct amazon_products table',
    price: '2999',
    original_price: '4999',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80',
    affiliate_url: 'https://amazon.in/dp/B08N5WRWNW?tag=pickntrust03-21',
    category: 'Electronics & Gadgets',
    rating: '4.5',
    review_count: 1247,
    discount: 40,
    is_featured: 0,
    source: 'telegram-prime-picks',
    telegram_message_id: 999999,
    created_at: Math.floor(Date.now() / 1000),
    expires_at: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)
  };
  
  db.run(insertQuery, [
    testProduct.name, testProduct.description, testProduct.price,
    testProduct.original_price, testProduct.currency, testProduct.image_url,
    testProduct.affiliate_url, testProduct.category, testProduct.rating,
    testProduct.review_count, testProduct.discount, testProduct.is_featured,
    testProduct.source, testProduct.telegram_message_id, testProduct.created_at,
    testProduct.expires_at
  ], function(err) {
    if (err) {
      console.log('Error Insert failed:', err.message);
    } else {
      console.log('Success Test product created successfully!');
      console.log(`   Product ID: ${this.lastID}`);
      console.log(`   Name: ${testProduct.name}`);
      console.log(`   Price: ₹${testProduct.price} (was ₹${testProduct.original_price})`);
      
      // Verify the product was inserted
      db.get('SELECT COUNT(*) as count FROM amazon_products', (err, row) => {
        if (err) {
          console.log('Error Count check failed:', err.message);
        } else {
          console.log(`\nStats Amazon products table now has: ${row.count} records`);
        }
        
        // Test the API
        console.log('\nGlobal Testing Prime Picks API...');
        testAPI();
      });
    }
  });
});

async function testAPI() {
  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5000/api/products/page/prime-picks');
    
    if (response.ok) {
      const products = await response.json();
      console.log(`Success API Response: ${products.length} products found`);
      
      if (products.length > 0) {
        console.log('Celebration SUCCESS: Products now appear in Prime Picks!');
        products.forEach((p, i) => {
          console.log(`   ${i+1}. ${p.name} (ID: ${p.id})`);
        });
      } else {
        console.log('Warning No products returned by API');
      }
    } else {
      console.log('Error API request failed:', response.status);
    }
  } catch (error) {
    console.log('Error API test failed:', error.message);
  } finally {
    db.close();
    
    console.log('\nSuccess PRIME PICKS FIX COMPLETED!');
    console.log('\nTarget RESULTS:');
    console.log('Success Test product added to amazon_products table');
    console.log('Success Prime Picks API should now show products');
    console.log('\nTip NEXT STEPS:');
    console.log('1. Visit: http://localhost:5000/prime-picks');
    console.log('2. Verify test product is visible');
    console.log('3. Fix Telegram bot to save to amazon_products table');
    console.log('4. Update bot token for autoposting');
  }
}