const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('=== CHECKING FLIGHT DATA ===\n');

try {
  // Check all flight records
  const flights = db.prepare(`
    SELECT id, name, category, subcategory, processing_status, travel_type 
    FROM travel_products 
    WHERE category = 'flights'
  `).all();
  
  console.log(`📊 Found ${flights.length} flight records:\n`);
  
  flights.forEach(flight => {
    console.log(`🛫 ID: ${flight.id}`);
    console.log(`   Name: ${flight.name}`);
    console.log(`   Category: ${flight.category}`);
    console.log(`   Section: ${flight.subcategory}`);
    console.log(`   Status: ${flight.processing_status}`);
    
    // Parse travel_type JSON to see section data
    try {
      const travelData = JSON.parse(flight.travel_type || '{}');
      console.log(`   Section Type: ${travelData.sectionType}`);
      console.log(`   Text Color: ${travelData.textColor}`);
    } catch (e) {
      console.log(`   Travel Data (raw): ${flight.travel_type}`);
    }
    console.log('');
  });
  
  // Test the API endpoint for flights
  console.log('🔍 Testing API response structure...');
  const apiData = db.prepare(`
    SELECT 
      id, name, description, price, original_price as originalPrice, currency,
      image_url as imageUrl, affiliate_url as affiliateUrl, category, 
      subcategory as sectionType, travel_type as categoryData, 
      source, created_at as createdAt
    FROM travel_products 
    WHERE category = 'flights' AND processing_status = 'active'
    ORDER BY created_at DESC
  `).all();
  
  console.log(`\n📡 API would return ${apiData.length} flight records`);
  
  // Group by section type like the API does
  const groupedDeals = {
    featured: [],
    standard: [],
    destinations: []
  };
  
  apiData.forEach(deal => {
    let categoryData = {};
    try {
      categoryData = JSON.parse(deal.categoryData || '{}');
    } catch (e) {
      categoryData = {};
    }
    
    const parsedDeal = {
      ...deal,
      categoryData,
      ...categoryData
    };
    
    const sectionType = deal.sectionType || 'standard';
    if (groupedDeals[sectionType]) {
      groupedDeals[sectionType].push(parsedDeal);
    } else {
      groupedDeals.standard.push(parsedDeal);
    }
  });
  
  console.log('\n📋 Grouped data structure:');
  console.log(`   Featured: ${groupedDeals.featured.length} items`);
  console.log(`   Standard: ${groupedDeals.standard.length} items`);
  console.log(`   Destinations: ${groupedDeals.destinations.length} items`);
  
  if (groupedDeals.featured.length > 0) {
    console.log('\n✈️ Sample featured flight:');
    const sample = groupedDeals.featured[0];
    console.log(`   Name: ${sample.name}`);
    console.log(`   Price: ${sample.price}`);
    console.log(`   Image: ${sample.imageUrl}`);
    console.log(`   Section: ${sample.sectionType}`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

db.close();
console.log('\nDone.');