const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium quality wireless headphones with noise cancellation',
    price: '2999',
    original_price: '4999',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    affiliate_url: 'https://example.com/headphones',
    category: 'Electronics',
    rating: 4.5,
    review_count: 150,
    discount: 40,
    is_featured: 1,
    processing_status: 'active',
    display_pages: JSON.stringify(['home', 'click-picks']),
    created_at: Date.now()
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smartwatch',
    price: '5999',
    original_price: '8999',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    affiliate_url: 'https://example.com/smartwatch',
    category: 'Electronics',
    rating: 4.3,
    review_count: 89,
    discount: 33,
    is_featured: 1,
    processing_status: 'active',
    display_pages: JSON.stringify(['home', 'click-picks']),
    created_at: Date.now()
  },
  {
    name: 'Portable Power Bank 20000mAh',
    description: 'High capacity power bank for all your devices',
    price: '1499',
    original_price: '2499',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1609592806787-3d9c1b8b7e7e?w=400',
    affiliate_url: 'https://example.com/powerbank',
    category: 'Electronics',
    rating: 4.2,
    review_count: 234,
    discount: 40,
    is_featured: 0,
    processing_status: 'active',
    display_pages: JSON.stringify(['click-picks']),
    created_at: Date.now()
  }
];

const insertStmt = db.prepare(`
  INSERT INTO unified_content (
    title, description, price, original_price, image_url, 
    affiliate_url, category, rating, review_count, 
    processing_status, display_pages, created_at, content_type, page_type, source_type, status, visibility
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleProducts.forEach(product => {
  insertStmt.run(
    product.name, product.description, product.price, product.original_price,
    product.image_url, product.affiliate_url, product.category,
    product.rating, product.review_count, 
    product.processing_status, product.display_pages, product.created_at,
    'product', 'click-picks', 'manual', 'active', 'public'
  );
});

console.log('Added', sampleProducts.length, 'sample products to unified_content table for click-picks page');
db.close();