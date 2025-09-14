const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🚀 CONSOLIDATING TRAVEL TABLES INTO UNIFIED STRUCTURE');
console.log('='.repeat(60));

try {
  // Step 1: Create the unified travel_products table
  console.log('\n📋 Step 1: Creating unified travel_products table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS travel_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      original_price TEXT,
      currency TEXT DEFAULT 'INR',
      image_url TEXT,
      affiliate_url TEXT,
      original_url TEXT,
      
      -- Travel-specific fields
      category TEXT DEFAULT 'travel',
      subcategory TEXT, -- hotels, flights, packages, tours, bus, train, etc.
      travel_type TEXT, -- Same as subcategory for consistency
      partner TEXT,
      route TEXT,
      duration TEXT,
      valid_till TEXT,
      
      -- Standard product fields
      rating REAL,
      review_count INTEGER,
      discount INTEGER,
      is_new BOOLEAN DEFAULT 0,
      is_featured BOOLEAN DEFAULT 0,
      
      -- Category metadata (from travel_categories)
      category_icon TEXT, -- fas fa-plane, fas fa-bed, etc.
      category_color TEXT, -- #2196F3, #FF9800, etc.
      
      -- System fields
      source TEXT DEFAULT 'travel_picks',
      processing_status TEXT DEFAULT 'active',
      created_at INTEGER,
      updated_at INTEGER
    )
  `;
  
  db.exec(createTableSQL);
  console.log('✅ Unified travel_products table created successfully!');
  
  // Step 2: Get category metadata from travel_categories
  console.log('\n📋 Step 2: Loading category metadata...');
  const categories = db.prepare('SELECT * FROM travel_categories').all();
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = {
      icon: cat.icon,
      color: cat.color
    };
  });
  console.log(`✅ Loaded ${categories.length} category definitions`);
  
  // Step 3: Migrate data from travel_deals
  console.log('\n📋 Step 3: Migrating data from travel_deals...');
  const travelDeals = db.prepare('SELECT * FROM travel_deals').all();
  
  const insertStmt = db.prepare(`
    INSERT INTO travel_products (
      name, description, price, original_price, currency, image_url, affiliate_url, original_url,
      category, subcategory, travel_type, partner, route, duration, valid_till,
      rating, review_count, discount, is_new, is_featured,
      category_icon, category_color, source, processing_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let migratedCount = 0;
  travelDeals.forEach(deal => {
    const categoryMeta = categoryMap[deal.subcategory] || categoryMap['flights'] || { icon: 'fas fa-plane', color: '#2196F3' };
    
    insertStmt.run(
      deal.name,
      deal.description,
      deal.price,
      deal.originalPrice,
      deal.currency || 'INR',
      deal.imageUrl,
      deal.affiliateUrl,
      deal.originalUrl,
      'travel',
      deal.subcategory,
      deal.travelType || deal.subcategory,
      deal.partner,
      deal.route,
      deal.duration,
      deal.validTill,
      deal.rating,
      deal.reviewCount,
      null, // discount - calculate if needed
      0, // is_new
      0, // is_featured
      categoryMeta.icon,
      categoryMeta.color,
      'travel_deals_migrated',
      deal.processingStatus || 'active',
      deal.createdAt || Date.now(),
      deal.updatedAt || Date.now()
    );
    migratedCount++;
  });
  console.log(`✅ Migrated ${migratedCount} records from travel_deals`);
  
  // Step 4: Migrate data from travel_picks_products
  console.log('\n📋 Step 4: Migrating data from travel_picks_products...');
  const travelPicksProducts = db.prepare('SELECT * FROM travel_picks_products').all();
  
  let migratedCount2 = 0;
  travelPicksProducts.forEach(product => {
    // Map category to subcategory
    let subcategory = 'packages'; // default
    if (product.category.toLowerCase().includes('beach')) subcategory = 'hotels';
    if (product.category.toLowerCase().includes('hill')) subcategory = 'packages';
    
    const categoryMeta = categoryMap[subcategory] || { icon: 'fas fa-suitcase', color: '#FF9800' };
    
    insertStmt.run(
      product.name,
      product.description,
      product.price,
      product.original_price,
      product.currency || 'INR',
      product.image_url,
      product.affiliate_url,
      product.original_url,
      'travel',
      subcategory,
      subcategory,
      product.affiliate_network,
      null, // route
      null, // duration
      null, // valid_till
      product.rating,
      product.review_count,
      product.discount,
      product.is_new,
      product.is_featured,
      categoryMeta.icon,
      categoryMeta.color,
      'travel_picks_products_migrated',
      product.processing_status || 'active',
      product.created_at || Date.now(),
      product.updated_at || Date.now()
    );
    migratedCount2++;
  });
  console.log(`✅ Migrated ${migratedCount2} records from travel_picks_products`);
  
  // Step 5: Verify the migration
  console.log('\n📋 Step 5: Verifying migration...');
  const totalRecords = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`✅ Total records in unified table: ${totalRecords.count}`);
  
  // Show sample data
  console.log('\n📋 Sample unified data:');
  const samples = db.prepare('SELECT id, name, subcategory, category_icon, source FROM travel_products LIMIT 3').all();
  samples.forEach(sample => {
    console.log(`  ID: ${sample.id}, Name: ${sample.name}, Type: ${sample.subcategory}, Icon: ${sample.category_icon}, Source: ${sample.source}`);
  });
  
  console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Update API to use travel_products table');
  console.log('2. Update delete endpoint mapping');
  console.log('3. Test frontend functionality');
  console.log('4. Drop old tables after verification');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}

console.log('\n✅ Database connection closed.');