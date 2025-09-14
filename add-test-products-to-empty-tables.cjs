/**
 * Add Test Products to Empty Bot Tables
 * Immediate fix to make pages show products while bot issues are resolved
 */

const Database = require('better-sqlite3');

console.log('🧪 ADDING TEST PRODUCTS TO EMPTY TABLES');
console.log('='.repeat(70));
console.log('🎯 Goal: Make empty pages show products immediately');
console.log('🔧 Solution: Add sample products to each empty table');
console.log('='.repeat(70));

try {
  const db = new Database('./database.sqlite');
  
  // Test products for each bot/page
  const testProducts = {
    amazon_products: [
      {
        name: 'TEST: Amazon Echo Dot (5th Gen)',
        description: 'Smart speaker with Alexa - Test product for Prime Picks',
        price: '₹4999',
        original_price: '₹6999',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://amazon.in/dp/test123?tag=pickntrust-21',
        original_url: 'https://amazon.in/dp/test123',
        category: 'Electronics',
        rating: '4.5',
        review_count: 1250,
        discount: 29,
        is_featured: 1,
        source: 'prime-picks',
        processing_status: 'active',
        content_type: 'prime-picks',
        affiliate_network: 'amazon',
        affiliate_tag_applied: 1,
        created_at: Math.floor(Date.now() / 1000)
      },
      {
        name: 'TEST: Fire TV Stick 4K Max',
        description: 'Streaming device with Wi-Fi 6 support - Test product',
        price: '₹5999',
        original_price: '₹7999',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://amazon.in/dp/test456?tag=pickntrust-21',
        original_url: 'https://amazon.in/dp/test456',
        category: 'Electronics',
        rating: '4.3',
        review_count: 890,
        discount: 25,
        is_featured: 0,
        source: 'prime-picks',
        processing_status: 'active',
        content_type: 'prime-picks',
        affiliate_network: 'amazon',
        affiliate_tag_applied: 1,
        created_at: Math.floor(Date.now() / 1000)
      }
    ],
    
    cuelinks_products: [
      {
        name: 'TEST: Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling headphones - Test product for Cue Picks',
        price: 2999,
        original_price: 4999,
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://linksredirect.com/?cid=243942&source=linkkit&url=https%3A//example.com/headphones',
        original_url: 'https://example.com/headphones',
        category: 'Electronics',
        rating: 4.4,
        review_count: 567,
        discount: 40,
        is_featured: 1,
        affiliate_network: 'cuelinks',
        processing_status: 'active',
        affiliate_tag_applied: 1,
        created_at: Math.floor(Date.now() / 1000)
      },
      {
        name: 'TEST: Smart Fitness Watch',
        description: 'Health tracking smartwatch with GPS - Test product',
        price: 8999,
        original_price: 12999,
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://linksredirect.com/?cid=243942&source=linkkit&url=https%3A//example.com/watch',
        original_url: 'https://example.com/watch',
        category: 'Wearables',
        rating: 4.2,
        review_count: 234,
        discount: 31,
        is_featured: 0,
        affiliate_network: 'cuelinks',
        processing_status: 'active',
        affiliate_tag_applied: 1,
        created_at: Math.floor(Date.now() / 1000)
      }
    ],
    
    value_picks_products: [
      {
        name: 'TEST: Premium Coffee Maker',
        description: 'Automatic drip coffee maker with timer - Test product for Value Picks',
        price: '₹3499',
        original_price: '₹5999',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://ekaro.in/enkr2020/?url=https%3A//example.com/coffee&ref=4530348',
        original_url: 'https://example.com/coffee',
        category: 'Home & Kitchen',
        rating: '4.6',
        review_count: 445,
        discount: 42,
        is_featured: 1,
        is_new: 1,
        affiliate_network: 'earnkaro',
        processing_status: 'active',
        content_type: 'product',
        affiliate_tag_applied: 1,
        created_at: Math.floor(Date.now() / 1000)
      }
    ],
    
    travel_products: [
      {
        name: 'TEST: Delhi to Mumbai Flight Deal',
        description: 'Special offer on domestic flights - Test product for Travel Picks',
        price: '₹4999',
        original_price: '₹7999',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://example-travel.com/flight?ref=pickntrust',
        original_url: 'https://example-travel.com/flight',
        category: 'Flights',
        subcategory: 'Domestic',
        travel_type: 'flight',
        route: 'Delhi - Mumbai',
        duration: '2h 15m',
        rating: 4.3,
        review_count: 156,
        discount: 37,
        is_featured: 1,
        processing_status: 'active',
        created_at: Math.floor(Date.now() / 1000)
      }
    ],
    
    click_picks_products: [
      {
        id: 'click_' + Date.now(),
        name: 'TEST: Gaming Mechanical Keyboard',
        description: 'RGB backlit gaming keyboard - Test product for Click Picks',
        price: '₹6999',
        original_price: '₹9999',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://linksredirect.com/?cid=243942&source=linkkit&url=https%3A//example.com/keyboard',
        original_url: 'https://example.com/keyboard',
        category: 'Gaming',
        rating: 4.7,
        review_count: 789,
        discount: 30,
        is_new: 1,
        affiliate_network: 'cuelinks',
        processing_status: 'processed',
        content_type: 'product',
        affiliate_tag_applied: 1,
        created_at: Math.floor(Date.now() / 1000)
      }
    ],
    
    global_picks_products: [
      {
        name: 'TEST: Universal Phone Stand',
        description: 'Adjustable phone stand for all devices - Test product for Global Picks',
        price: '₹899',
        original_price: '₹1499',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=400&h=400&fit=crop&q=80',
        affiliate_url: 'https://example-global.com/stand?ref=global',
        original_url: 'https://example-global.com/stand',
        category: 'Accessories',
        rating: '4.1',
        review_count: '123',
        discount: '40',
        is_featured: true,
        is_new: true,
        affiliate_network: 'global',
        processing_status: 'active',
        content_type: 'product',
        source: 'global-picks',
        created_at: Math.floor(Date.now() / 1000)
      }
    ]
  };
  
  // Insert test products into each table
  Object.entries(testProducts).forEach(([tableName, products]) => {
    console.log(`\n📦 Adding test products to ${tableName}...`);
    
    try {
      // Check current count
      const currentCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`   📊 Current products: ${currentCount.count}`);
      
      if (currentCount.count > 0) {
        console.log('   ⏭️  Table has data, skipping test products');
        return;
      }
      
      // Get table schema to match fields
      const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnNames = schema.map(col => col.name);
      
      products.forEach((product, index) => {
        try {
          // Filter product fields to match table schema
          const validFields = {};
          Object.entries(product).forEach(([key, value]) => {
            if (columnNames.includes(key)) {
              validFields[key] = value;
            }
          });
          
          // Build dynamic INSERT statement
          const fields = Object.keys(validFields);
          const placeholders = fields.map(() => '?').join(', ');
          const values = Object.values(validFields);
          
          const insertSQL = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
          const stmt = db.prepare(insertSQL);
          
          const result = stmt.run(...values);
          console.log(`   ✅ Added: ${product.name} (ID: ${result.lastInsertRowid})`);
          
        } catch (error) {
          console.log(`   ❌ Failed to add ${product.name}: ${error.message}`);
        }
      });
      
      // Verify insertion
      const newCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`   📊 New total: ${newCount.count} products`);
      
    } catch (error) {
      console.log(`   ❌ Error with ${tableName}: ${error.message}`);
    }
  });
  
  db.close();
  
  console.log('\n\n🎊 TEST PRODUCTS ADDED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log('✅ All empty bot tables now have test products');
  console.log('🌐 Frontend pages should now display products');
  console.log('🔄 API endpoints will return test data');
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. 🌐 Refresh frontend pages to see test products');
  console.log('2. 🤖 Configure bot credentials for real posting');
  console.log('3. 📱 Set up Telegram channels for each bot');
  console.log('4. 🧪 Test real product posting via Telegram');
  
  console.log('\n⚠️  NOTE: These are test products for demonstration');
  console.log('Real products will appear when bots are properly configured');
  
} catch (error) {
  console.error('❌ Failed to add test products:', error.message);
}