// Create Click Picks Products Table
// This creates the click_picks_products table with the same schema as amazon_products and cuelinks_products

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Creating Click Picks Products Table...');

try {
  // Create click_picks_products table with same schema as other product tables
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS click_picks_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT NOT NULL,
      original_price TEXT,
      currency TEXT DEFAULT 'INR',
      image_url TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      category TEXT NOT NULL,
      rating TEXT NOT NULL,
      review_count INTEGER NOT NULL,
      discount INTEGER,
      is_new INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      affiliate_network TEXT DEFAULT 'Click Picks Network',
      telegram_message_id INTEGER,
      processing_status TEXT DEFAULT 'active',
      source_metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      
      -- Bundle processing fields
      message_group_id TEXT,
      product_sequence INTEGER DEFAULT 1,
      total_in_group INTEGER DEFAULT 1,
      
      -- Limited offer fields
      has_limited_offer INTEGER DEFAULT 0,
      limited_offer_text TEXT,
      offer_expires_at INTEGER
    )
  `;
  
  db.exec(createTableQuery);
  console.log('Success Click Picks products table created successfully');
  
  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_click_picks_category ON click_picks_products(category)',
    'CREATE INDEX IF NOT EXISTS idx_click_picks_created_at ON click_picks_products(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_click_picks_telegram_id ON click_picks_products(telegram_message_id)',
    'CREATE INDEX IF NOT EXISTS idx_click_picks_message_group ON click_picks_products(message_group_id)',
    'CREATE INDEX IF NOT EXISTS idx_click_picks_processing_status ON click_picks_products(processing_status)'
  ];
  
  indexes.forEach(indexQuery => {
    db.exec(indexQuery);
  });
  
  console.log('Success Indexes created for Click Picks table');
  
  // Insert some sample products to test the table
  const sampleProducts = [
    {
      name: 'Trending Wireless Earbuds',
      description: 'Most clicked wireless earbuds with premium sound quality and long battery life',
      price: '2999',
      original_price: '4999',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop&q=80',
      affiliate_url: 'https://example.com/trending-earbuds',
      category: 'Electronics',
      rating: '4.5',
      review_count: 1250,
      discount: 40,
      is_featured: 1,
      telegram_message_id: Date.now()
    },
    {
      name: 'Popular Fitness Tracker',
      description: 'Most clicked fitness tracker with heart rate monitoring and sleep tracking',
      price: '3499',
      original_price: '5999',
      image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&h=500&fit=crop&q=80',
      affiliate_url: 'https://example.com/fitness-tracker',
      category: 'Sports & Fitness',
      rating: '4.3',
      review_count: 890,
      discount: 42,
      is_new: 1,
      telegram_message_id: Date.now() + 1
    },
    {
      name: 'Trending Smartphone Case',
      description: 'Most clicked protective case with premium materials and perfect fit',
      price: '599',
      original_price: '999',
      image_url: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=500&h=500&fit=crop&q=80',
      affiliate_url: 'https://example.com/phone-case',
      category: 'Electronics',
      rating: '4.7',
      review_count: 2100,
      discount: 40,
      telegram_message_id: Date.now() + 2
    }
  ];
  
  const insertQuery = `
    INSERT INTO click_picks_products (
      name, description, price, original_price, image_url, affiliate_url,
      category, rating, review_count, discount, is_new, is_featured, telegram_message_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const insertStmt = db.prepare(insertQuery);
  
  sampleProducts.forEach(product => {
    insertStmt.run(
      product.name,
      product.description,
      product.price,
      product.original_price,
      product.image_url,
      product.affiliate_url,
      product.category,
      product.rating,
      product.review_count,
      product.discount,
      product.is_new || 0,
      product.is_featured || 0,
      product.telegram_message_id
    );
  });
  
  console.log(`Success Inserted ${sampleProducts.length} sample Click Picks products`);
  
  // Verify the table creation
  const count = db.prepare('SELECT COUNT(*) as count FROM click_picks_products').get();
  console.log(`Stats Click Picks table now has ${count.count} products`);
  
  // Show table schema
  console.log('\n📋 Click Picks Table Schema:');
  const schema = db.prepare('PRAGMA table_info(click_picks_products)').all();
  schema.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
  });
  
} catch (error) {
  console.error('Error Error creating Click Picks table:', error.message);
} finally {
  db.close();
}

console.log('\nTarget Click Picks Database Setup Complete!');
console.log('Success Table: click_picks_products');
console.log('Success Indexes: Performance optimized');
console.log('Success Sample Data: Ready for testing');
console.log('Success Schema: Compatible with existing product tables');