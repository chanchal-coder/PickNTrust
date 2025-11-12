const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Using database at:', dbPath);

const db = new Database(dbPath);

const payload = {
  title: 'Debug Insert Product',
  description: 'Inserted via debug script',
  price: 99.99,
  original_price: 149.99,
  currency: 'INR',
  image_url: 'https://via.placeholder.com/300x200?text=Product',
  affiliate_url: 'https://example.com/product-debug',
  category: 'General',
  rating: 4.5,
  review_count: 12,
  content_type: 'product',
  is_featured: 1,
  display_pages: JSON.stringify(['home','apps','deals']),
};

const sql = `
  INSERT INTO unified_content (
    title, description, price, original_price, currency,
    image_url, affiliate_url, category, rating, review_count,
    content_type, status, visibility, processing_status,
    is_featured, display_pages, created_at, updated_at
  ) VALUES (
    @title, @description, @price, @original_price, @currency,
    @image_url, @affiliate_url, @category, @rating, @review_count,
    @content_type, 'active', 'public', 'completed',
    @is_featured, @display_pages, datetime('now'), datetime('now')
  )
`;

try {
  const stmt = db.prepare(sql);
  const result = stmt.run(payload);
  console.log('Insert ok. New id:', result.lastInsertRowid);
} catch (err) {
  console.error('Insert failed:', err.message);
  console.error(err);
}

db.close();