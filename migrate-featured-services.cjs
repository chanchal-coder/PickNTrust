const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Refresh Migrating featured services to featured_products table...');

try {
  // Get featured services from main table that are not already in featured_products
  const featuredServices = db.prepare(`
    SELECT id, name, description, price, original_price, currency, image_url, affiliate_url, 
           original_url, category, subcategory, rating, review_count, discount, 
           affiliate_network, is_new, created_at, expires_at
    FROM products 
    WHERE is_service = 1 AND is_featured = 1
  `).all();
  
  console.log(`Stats Found ${featuredServices.length} featured services to migrate`);
  
  if (featuredServices.length === 0) {
    console.log('Success No featured services to migrate');
    db.close();
    process.exit(0);
  }
  
  // Check which ones are already in featured_products
  const existingFeatured = db.prepare(`
    SELECT name FROM featured_products WHERE source = 'migrated'
  `).all();
  
  const existingNames = existingFeatured.map(f => f.name);
  const servicesToMigrate = featuredServices.filter(s => !existingNames.includes(s.name));
  
  console.log(`📋 ${servicesToMigrate.length} new featured services to migrate`);
  
  if (servicesToMigrate.length === 0) {
    console.log('Success All featured services already migrated');
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
  
  for (const service of servicesToMigrate) {
    try {
      insertStmt.run(
        service.name || '',
        service.description || '',
        service.price ? service.price.toString() : '0',
        service.original_price ? service.original_price.toString() : null,
        service.currency || 'INR',
        service.image_url || '',
        service.affiliate_url || '',
        service.original_url || '',
        service.category || 'Services',
        service.subcategory || null,
        service.rating ? service.rating.toString() : '0',
        service.review_count ? service.review_count.toString() : '0',
        service.discount ? service.discount.toString() : '0',
        1, // is_featured (integer)
        service.is_new ? 1 : 0, // is_new (integer)
        1, // is_active (integer)
        0, // display_order
        0, // has_timer (integer)
        null, // timer_duration
        null, // timer_start_time
        0, // has_limited_offer (integer)
        null, // limited_offer_text
        service.affiliate_network || null,
        null, // affiliate_network_id
        null, // commission_rate
        0, // click_count
        0, // conversion_count
        0, // view_count
        Math.floor(Date.now() / 1000), // created_at
        Math.floor(Date.now() / 1000), // updated_at
        null, // expires_at
        'migrated-service', // source
        'service', // content_type
        null // gender
      );
      
      migratedCount++;
      console.log(`Success Migrated featured service: ${service.name}`);
      
    } catch (error) {
      console.error(`Error Error migrating ${service.name}:`, error.message);
    }
  }
  
  console.log(`\nCelebration Successfully migrated ${migratedCount} out of ${servicesToMigrate.length} featured services`);
  
} catch (error) {
  console.error('Error Migration error:', error.message);
} finally {
  db.close();
}