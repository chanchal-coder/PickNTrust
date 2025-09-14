const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Hot Adding sample featured products...');

// Create the featured_products table if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS featured_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  original_url TEXT,
  category TEXT,
  subcategory TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 1,
  is_new INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  has_timer INTEGER DEFAULT 0,
  timer_duration INTEGER,
  timer_start_time INTEGER,
  has_limited_offer INTEGER DEFAULT 0,
  limited_offer_text TEXT,
  affiliate_network TEXT,
  affiliate_network_id INTEGER,
  commission_rate REAL,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER,
  source TEXT DEFAULT 'manual',
  content_type TEXT DEFAULT 'product',
  gender TEXT
)`;

try {
  db.exec(createTableQuery);
  console.log('Success Featured products table created/verified');
} catch (error) {
  console.error('Error Error creating table:', error);
}

// Sample featured products
const sampleProducts = [
  {
    name: "iPhone 15 Pro Max",
    description: "Latest Apple iPhone with titanium design and advanced camera system",
    price: "1199",
    original_price: "1399",
    currency: "USD",
    image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80",
    affiliate_url: "https://amazon.com/dp/B0CHX1W1XY",
    category: "Electronics",
    rating: "4.8",
    review_count: "2847",
    discount: "14",
    is_featured: 1,
    is_new: 1,
    display_order: 1,
    has_timer: 1,
    timer_duration: 24,
    timer_start_time: Math.floor(Date.now() / 1000),
    affiliate_network: "Amazon",
    source: "manual"
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Premium Android smartphone with S Pen and AI features",
    price: "999",
    original_price: "1199",
    currency: "USD",
    image_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
    affiliate_url: "https://amazon.com/dp/SAMSUNGS24",
    category: "Electronics",
    rating: "4.7",
    review_count: "1523",
    discount: "17",
    is_featured: 1,
    is_new: 1,
    display_order: 2,
    affiliate_network: "Amazon",
    source: "manual"
  },
  {
    name: "Nike Air Max 270",
    description: "Comfortable running shoes with Max Air cushioning",
    price: "89",
    original_price: "129",
    currency: "USD",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    affiliate_url: "https://amazon.com/dp/NIKEAIRMAX270",
    category: "Fashion",
    rating: "4.6",
    review_count: "892",
    discount: "31",
    is_featured: 1,
    display_order: 3,
    affiliate_network: "Amazon",
    source: "manual"
  },
  {
    name: "MacBook Air M3",
    description: "Ultra-thin laptop with Apple M3 chip and all-day battery",
    price: "1099",
    original_price: "1299",
    currency: "USD",
    image_url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80",
    affiliate_url: "https://amazon.com/dp/MACBOOKAIRM3",
    category: "Electronics",
    rating: "4.9",
    review_count: "1247",
    discount: "15",
    is_featured: 1,
    is_new: 1,
    display_order: 4,
    has_limited_offer: 1,
    limited_offer_text: "Limited Time: Free AirPods with purchase",
    affiliate_network: "Amazon",
    source: "manual"
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise canceling wireless headphones",
    price: "299",
    original_price: "399",
    currency: "USD",
    image_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80",
    affiliate_url: "https://amazon.com/dp/SONYWH1000XM5",
    category: "Electronics",
    rating: "4.8",
    review_count: "3421",
    discount: "25",
    is_featured: 1,
    display_order: 5,
    affiliate_network: "Amazon",
    source: "manual"
  },
  {
    name: "Instant Pot Duo 7-in-1",
    description: "Multi-functional electric pressure cooker for quick meals",
    price: "79",
    original_price: "119",
    currency: "USD",
    image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
    affiliate_url: "https://amazon.com/dp/INSTANTPOTDUO",
    category: "Home & Kitchen",
    rating: "4.7",
    review_count: "15623",
    discount: "34",
    is_featured: 1,
    display_order: 6,
    affiliate_network: "Amazon",
    source: "manual"
  }
];

// Insert sample products
const insertQuery = `
INSERT INTO featured_products (
  name, description, price, original_price, currency, image_url, affiliate_url,
  category, rating, review_count, discount, is_featured, is_new, display_order,
  has_timer, timer_duration, timer_start_time, has_limited_offer, limited_offer_text,
  affiliate_network, source
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)`;

const insertStmt = db.prepare(insertQuery);

try {
  // Clear existing data
  db.exec('DELETE FROM featured_products');
  console.log('🗑️ Cleared existing featured products');
  
  // Insert new products
  for (const product of sampleProducts) {
    insertStmt.run(
      product.name,
      product.description,
      product.price,
      product.original_price,
      product.currency,
      product.image_url,
      product.affiliate_url,
      product.category,
      product.rating,
      product.review_count,
      product.discount,
      product.is_featured,
      product.is_new || 0,
      product.display_order,
      product.has_timer || 0,
      product.timer_duration || null,
      product.timer_start_time || null,
      product.has_limited_offer || 0,
      product.limited_offer_text || null,
      product.affiliate_network,
      product.source
    );
  }
  
  console.log(`Success Added ${sampleProducts.length} featured products`);
  
  // Verify the data
  const count = db.prepare('SELECT COUNT(*) as count FROM featured_products').get();
  console.log(`Stats Total featured products in database: ${count.count}`);
  
  // Show the products
  const products = db.prepare('SELECT id, name, price, discount, display_order FROM featured_products ORDER BY display_order').all();
  console.log('\n📋 Featured Products:');
  products.forEach(p => {
    console.log(`  ${p.display_order}. ${p.name} - $${p.price} (${p.discount}% off)`);
  });
  
} catch (error) {
  console.error('Error Error inserting products:', error);
} finally {
  db.close();
  console.log('\nCelebration Featured products setup complete!');
}