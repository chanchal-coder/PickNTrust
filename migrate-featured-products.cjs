const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Refresh Migrating existing featured products to featured_products table...');

try {
  // Get all featured products from main table
  const featuredProducts = db.prepare(`
    SELECT id, name, description, price, original_price, currency, image_url, affiliate_url, 
           original_url, category, subcategory, rating, review_count, discount, 
           affiliate_network, is_new, created_at, expires_at
    FROM products 
    WHERE is_featured = 1
  `).all();
  
  console.log(`Stats Found ${featuredProducts.length} featured products to migrate`);
  
  if (featuredProducts.length === 0) {
    console.log('Success No products to migrate');
    db.close();
    process.exit(0);
  }
  
  // Prepare insert statement for featured_products table
  const insertStmt = db.prepare(`
    INSERT INTO featured_products (
      name, description, price, original_price, currency, image_url, affiliate_url,
      original_url, category, subcategory, rating, review_count, discount,
      is_featured, is_new, is_active, display_order, has_timer, timer_duration, timer_start_time,
      has_limited_offer, limited_offer_text, affiliate_network, affiliate_network_id,
      commission_rate, click_count, conversion_count, view_count, created_at, updated_at,
      expires_at, source, content_type, gender
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  let migratedCount = 0;
  
  for (const product of featuredProducts) {
    try {
      insertStmt.run(
        product.name || '',
        product.description || '',
        product.price ? product.price.toString() : '0',
        product.original_price ? product.original_price.toString() : null,
        product.currency || 'INR',
        product.image_url || '',
        product.affiliate_url || '',
        product.original_url || '',
        product.category || 'General',
        product.subcategory || null,
        product.rating ? product.rating.toString() : '0',
        product.review_count ? product.review_count.toString() : '0',
        product.discount ? product.discount.toString() : '0',
        1, // is_featured (integer)
        product.is_new ? 1 : 0, // is_new (integer)
        1, // is_active (integer)
        0, // display_order
        0, // has_timer (integer)
        null, // timer_duration
        null, // timer_start_time
        0, // has_limited_offer (integer)
        null, // limited_offer_text
        product.affiliate_network || null,
        null, // affiliate_network_id
        null, // commission_rate
        0, // click_count
        0, // conversion_count
        0, // view_count
        Math.floor(Date.now() / 1000), // created_at
        Math.floor(Date.now() / 1000), // updated_at
        null, // expires_at
        'migrated', // source
        'product', // content_type
        null // gender
      );
      
      migratedCount++;
      console.log(`Success Migrated: ${product.name}`);
      
    } catch (error) {
      console.error(`Error Error migrating ${product.name}:`, error.message);
    }
  }
  
  console.log(`\nCelebration Successfully migrated ${migratedCount} out of ${featuredProducts.length} featured products`);
  
} catch (error) {
  console.error('Error Migration error:', error.message);
} finally {
  db.close();
}