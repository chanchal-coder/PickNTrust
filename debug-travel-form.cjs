const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('=== COMPREHENSIVE TRAVEL FORM DEBUG ===\n');

// 1. Check table existence and schema
console.log('1️⃣ CHECKING TABLE SCHEMA...');
try {
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='travel_products'
  `).get();
  
  if (!tableExists) {
    console.log('❌ travel_products table does not exist!');
    process.exit(1);
  }
  
  console.log('✅ travel_products table exists');
  
  // Get detailed column info
  const columns = db.prepare('PRAGMA table_info(travel_products)').all();
  console.log('\n📊 Table Columns:');
  columns.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
} catch (error) {
  console.error('❌ Schema check error:', error.message);
  process.exit(1);
}

// 2. Test the exact SQL query from the API
console.log('\n2️⃣ TESTING SQL QUERY...');
try {
  // This is the exact query from the API
  const stmt = db.prepare(`
    INSERT INTO travel_products (
      name, description, price, original_price, currency,
      image_url, affiliate_url, category, subcategory, travel_type,
      source, processing_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  console.log('✅ SQL query prepared successfully');
  
  // Test data (similar to what form would send)
  const testData = {
    name: 'Test Hotel',
    description: 'A test hotel for debugging',
    price: '5000',
    originalPrice: '6000',
    currency: 'INR',
    imageUrl: 'https://example.com/image.jpg',
    affiliateUrl: 'https://example.com/book',
    category: 'hotels',
    sectionType: 'featured',
    textColor: '#000000',
    customSectionTitle: 'Test Section',
    customSectionDescription: 'Test Description',
    location: 'Mumbai',
    hotelType: 'Luxury'
  };
  
  const categoryFields = {
    location: testData.location,
    hotelType: testData.hotelType
  };
  
  // Execute the query with test data
  const result = stmt.run(
    testData.name,
    testData.description || '',
    testData.price || '0',
    testData.originalPrice || null,
    testData.currency || 'INR',
    testData.imageUrl || '',
    testData.affiliateUrl || '',
    testData.category,
    testData.sectionType, // Use sectionType as subcategory
    JSON.stringify({ 
      sectionType: testData.sectionType, 
      textColor: testData.textColor, 
      customSectionTitle: testData.customSectionTitle, 
      customSectionDescription: testData.customSectionDescription, 
      ...categoryFields 
    }), // Store all extra data as JSON
    'admin_form',
    'active',
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000)
  );
  
  console.log('✅ Test insertion successful!');
  console.log('   Inserted ID:', result.lastInsertRowid);
  console.log('   Changes:', result.changes);
  
} catch (error) {
  console.error('❌ SQL execution error:', error.message);
  console.error('   Error code:', error.code);
  console.error('   Full error:', error);
}

// 3. Verify the data was inserted
console.log('\n3️⃣ VERIFYING DATA INSERTION...');
try {
  const count = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`📈 Total records in travel_products: ${count.count}`);
  
  if (count.count > 0) {
    const latestRecord = db.prepare(`
      SELECT * FROM travel_products 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get();
    
    console.log('\n📋 Latest record:');
    console.log('   ID:', latestRecord.id);
    console.log('   Name:', latestRecord.name);
    console.log('   Category:', latestRecord.category);
    console.log('   Subcategory:', latestRecord.subcategory);
    console.log('   Travel Type (JSON):', latestRecord.travel_type);
    console.log('   Source:', latestRecord.source);
    console.log('   Status:', latestRecord.processing_status);
  }
  
} catch (error) {
  console.error('❌ Data verification error:', error.message);
}

// 4. Test the GET query
console.log('\n4️⃣ TESTING GET QUERY...');
try {
  const getStmt = db.prepare(`
    SELECT 
      id, name, description, price, original_price as originalPrice, currency,
      image_url as imageUrl, affiliate_url as affiliateUrl, category, 
      subcategory as sectionType, travel_type as categoryData, 
      source, created_at as createdAt
    FROM travel_products 
    WHERE category = ? AND processing_status = 'active'
    ORDER BY created_at DESC
  `);
  
  const results = getStmt.all('hotels');
  console.log(`✅ GET query successful! Found ${results.length} hotel records`);
  
  if (results.length > 0) {
    console.log('\n📋 Sample record:');
    const sample = results[0];
    console.log('   Name:', sample.name);
    console.log('   Price:', sample.price);
    console.log('   Section Type:', sample.sectionType);
    
    // Try to parse category data
    try {
      const categoryData = JSON.parse(sample.categoryData || '{}');
      console.log('   Category Data:', categoryData);
    } catch (e) {
      console.log('   Category Data (raw):', sample.categoryData);
    }
  }
  
} catch (error) {
  console.error('❌ GET query error:', error.message);
}

// 5. Clean up test data
console.log('\n5️⃣ CLEANING UP TEST DATA...');
try {
  const deleteResult = db.prepare(`
    DELETE FROM travel_products 
    WHERE name = 'Test Hotel' AND source = 'admin_form'
  `).run();
  
  console.log(`✅ Cleaned up ${deleteResult.changes} test records`);
  
} catch (error) {
  console.error('❌ Cleanup error:', error.message);
}

db.close();
console.log('\n🎯 DEBUG COMPLETE!');
console.log('\nIf all tests passed, the issue might be:');
console.log('1. Network/CORS issues');
console.log('2. Request body parsing problems');
console.log('3. Authentication/middleware blocking');
console.log('4. Frontend form data formatting');