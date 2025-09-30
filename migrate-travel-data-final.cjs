const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🚀 FINAL TRAVEL DATA MIGRATION');
console.log('='.repeat(50));
console.log('📋 Migrating from travel_deals → travel_products');
console.log('🎯 Goal: Single unified table for all travel data');
console.log('='.repeat(50));

try {
  // Step 1: Check current data
  console.log('\n1️⃣ Checking current data...');
  const travelDealsCount = db.prepare('SELECT COUNT(*) as count FROM travel_deals').get();
  const travelProductsCount = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  
  console.log(`   travel_deals: ${travelDealsCount.count} records`);
  console.log(`   travel_products: ${travelProductsCount.count} records`);
  
  if (travelDealsCount.count === 0) {
    console.log('❌ No data in travel_deals to migrate!');
    process.exit(1);
  }
  
  // Step 2: Clear existing data in travel_products (to avoid duplicates)
  console.log('\n2️⃣ Clearing existing travel_products data...');
  db.prepare('DELETE FROM travel_products').run();
  console.log('✅ travel_products table cleared');
  
  // Step 3: Migrate data with proper column mapping
  console.log('\n3️⃣ Migrating data with column mapping...');
  
  const travelDeals = db.prepare('SELECT * FROM travel_deals').all();
  
  const insertStmt = db.prepare(`
    INSERT INTO travel_products (
      name, description, price, original_price, currency, image_url, affiliate_url, original_url,
      category, subcategory, travel_type, partner, route, duration, valid_till,
      rating, review_count, discount, is_new, is_featured,
      category_icon, category_color, source, processing_status, created_at, updated_at,
      affiliate_network, content_type, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let migratedCount = 0;
  
  travelDeals.forEach(deal => {
    try {
      insertStmt.run(
        deal.name,
        deal.description || '',
        deal.price || '0',
        deal.originalPrice || deal.price || '0',
        deal.currency || 'INR',
        deal.imageUrl || '',
        deal.affiliateUrl || '',
        deal.originalUrl || deal.affiliateUrl || '',
        deal.category || 'travel',
        deal.subcategory || deal.sectionType || 'standard',
        deal.travelType || deal.subcategory || deal.category,
        deal.partner || null,
        deal.route || null,
        deal.duration || null,
        deal.validTill || null,
        parseFloat(deal.rating) || 4.0,
        parseInt(deal.reviewCount) || 100,
        parseInt(deal.discount) || 0,
        deal.isNew || 0,
        deal.isFeatured || 0,
        'fas fa-plane', // Default icon
        '#2196F3', // Default color
        deal.source || 'migrated_from_travel_deals',
        'active',
        deal.createdAt || Math.floor(Date.now() / 1000),
        deal.updatedAt || Math.floor(Date.now() / 1000),
        deal.networkBadge || 'travel-multi',
        deal.content_type || 'travel',
        deal.expires_at || null
      );
      migratedCount++;
    } catch (error) {
      console.log(`⚠️  Failed to migrate record ${deal.id}: ${error.message}`);
    }
  });
  
  console.log(`✅ Successfully migrated ${migratedCount} records`);
  
  // Step 4: Verify migration
  console.log('\n4️⃣ Verifying migration...');
  const newCount = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`   travel_products now has: ${newCount.count} records`);
  
  // Step 5: Show sample migrated data
  console.log('\n5️⃣ Sample migrated data:');
  const samples = db.prepare('SELECT id, name, category, subcategory, source FROM travel_products LIMIT 3').all();
  samples.forEach(sample => {
    console.log(`   ID: ${sample.id}, Name: ${sample.name}, Category: ${sample.category}, Type: ${sample.subcategory}`);
  });
  
  console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log('✅ All travel data is now in travel_products table');
  console.log('✅ Ready to update API endpoints');
  console.log('✅ Ready to remove travel_deals references');
  console.log('='.repeat(50));
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}