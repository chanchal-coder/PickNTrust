const Database = require('better-sqlite3');
const path = require('path');

console.log('Search Checking services functionality...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Check if services are properly stored and retrieved
  console.log('\nStats Services-related checks:');
  
  // 1. Check is_service column
  const columns = db.prepare("PRAGMA table_info(products)").all();
  const isServiceColumn = columns.find(col => col.name === 'is_service');
  
  if (isServiceColumn) {
    console.log(`Success is_service column exists: ${isServiceColumn.type} ${isServiceColumn.dflt_value ? `DEFAULT ${isServiceColumn.dflt_value}` : ''}`);
  } else {
    console.log('Error is_service column is missing!');
  }
  
  // 2. Check for existing service products
  console.log('\n📋 Current service products:');
  const services = db.prepare("SELECT id, name, category, is_service FROM products WHERE is_service = 1 LIMIT 5").all();
  if (services.length > 0) {
    services.forEach(service => {
      console.log(`  - ID: ${service.id}, Name: ${service.name}, Category: ${service.category}`);
    });
    console.log(`  Total services: ${db.prepare("SELECT COUNT(*) as count FROM products WHERE is_service = 1").get().count}`);
  } else {
    console.log('  No service products found in database');
  }
  
  // 3. Test service product insertion
  console.log('\n🧪 Testing service product insertion:');
  try {
    const testInsert = db.prepare(`
      INSERT INTO products (
        name, description, price, image_url, affiliate_url, category, 
        rating, review_count, is_featured, is_service, custom_fields, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const serviceData = {
      name: 'Test Credit Card Service',
      description: 'Testing service product insertion',
      price: 0, // Services might have 0 price
      imageUrl: 'https://example.com/card.jpg',
      affiliateUrl: 'https://example.com/apply',
      category: 'Credit Cards',
      rating: 4.5,
      reviewCount: 250,
      isFeatured: 1,
      isService: 1,
      customFields: JSON.stringify({
        serviceType: 'credit-card',
        provider: 'Test Bank',
        features: 'Cashback, No annual fee',
        eligibility: 'Age 18+, Good credit score'
      }),
      createdAt: Math.floor(Date.now() / 1000)
    };
    
    const result = testInsert.run(
      serviceData.name,
      serviceData.description,
      serviceData.price,
      serviceData.imageUrl,
      serviceData.affiliateUrl,
      serviceData.category,
      serviceData.rating,
      serviceData.reviewCount,
      serviceData.isFeatured,
      serviceData.isService,
      serviceData.customFields,
      serviceData.createdAt
    );
    
    console.log(`  Success Service insertion successful! New service ID: ${result.lastInsertRowid}`);
    
    // Test retrieval of service
    const insertedService = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
    console.log(`  Success Service retrieval successful: ${insertedService.name}`);
    console.log(`  Success is_service flag: ${insertedService.is_service}`);
    console.log(`  Success custom_fields: ${insertedService.custom_fields ? 'Present' : 'Missing'}`);
    
    // Clean up test service
    db.prepare("DELETE FROM products WHERE id = ?").run(result.lastInsertRowid);
    console.log(`  Cleanup Test service cleaned up`);
    
  } catch (insertError) {
    console.log(`  Error Service insertion failed: ${insertError.message}`);
  }
  
  // 4. Check service categories
  console.log('\n🏷️ Service-related categories:');
  const serviceCategories = [
    'Credit Cards', 'Banking Services', 'Streaming Services', 
    'Software & Apps', 'Insurance', 'Investment', 'Cards, Apps & Services'
  ];
  
  serviceCategories.forEach(category => {
    const count = db.prepare("SELECT COUNT(*) as count FROM products WHERE category = ?").get(category).count;
    console.log(`  - ${category}: ${count} products`);
  });
  
  // 5. Check custom_fields column for services
  console.log('\n🔧 Custom fields functionality:');
  const customFieldsColumn = columns.find(col => col.name === 'custom_fields');
  if (customFieldsColumn) {
    console.log(`  Success custom_fields column exists: ${customFieldsColumn.type}`);
    
    // Test JSON storage and retrieval
    try {
      const testCustomFields = {
        serviceType: 'credit-card',
        provider: 'Test Bank',
        features: 'Cashback, Rewards',
        eligibility: 'Good credit required'
      };
      
      const testId = db.prepare(`
        INSERT INTO products (name, description, price, image_url, affiliate_url, category, rating, review_count, is_service, custom_fields, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'Custom Fields Test',
        'Testing custom fields',
        0,
        'https://example.com/test.jpg',
        'https://example.com/test',
        'Credit Cards',
        4.0,
        100,
        1,
        JSON.stringify(testCustomFields),
        Math.floor(Date.now() / 1000)
      ).lastInsertRowid;
      
      const retrieved = db.prepare("SELECT custom_fields FROM products WHERE id = ?").get(testId);
      const parsedFields = JSON.parse(retrieved.custom_fields);
      
      console.log(`  Success JSON storage/retrieval working: ${parsedFields.serviceType}`);
      
      // Clean up
      db.prepare("DELETE FROM products WHERE id = ?").run(testId);
      
    } catch (jsonError) {
      console.log(`  Error Custom fields JSON handling failed: ${jsonError.message}`);
    }
  } else {
    console.log('  Error custom_fields column is missing!');
  }
  
} catch (error) {
  console.error('Error Error checking services functionality:', error.message);
} finally {
  db.close();
  console.log('\nDatabase connection closed');
}
