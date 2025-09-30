const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 DEBUGGING FLIGHT CARD DATA DISPLAY');
console.log('='.repeat(50));

try {
  // Get the latest flight record
  const flight = db.prepare(`
    SELECT * FROM travel_products 
    WHERE category = 'flights' 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get();
  
  if (!flight) {
    console.log('❌ No flight records found');
    return;
  }
  
  console.log('\n📊 RAW DATABASE DATA:');
  console.log('ID:', flight.id);
  console.log('Name:', flight.name);
  console.log('Price:', flight.price);
  console.log('Currency:', flight.currency);
  console.log('Category:', flight.category);
  console.log('Subcategory:', flight.subcategory);
  console.log('Travel Type (raw):', flight.travel_type);
  
  // Parse the travel_type JSON
  let parsedTravelData = {};
  if (flight.travel_type) {
    try {
      parsedTravelData = JSON.parse(flight.travel_type);
      console.log('\n✅ PARSED TRAVEL DATA:');
      console.log(JSON.stringify(parsedTravelData, null, 2));
    } catch (e) {
      console.log('\n❌ JSON PARSE ERROR:', e.message);
      console.log('Raw travel_type:', flight.travel_type);
    }
  } else {
    console.log('\n⚠️ No travel_type data found');
  }
  
  // Check what the frontend should display
  console.log('\n🎯 EXPECTED FRONTEND DISPLAY:');
  console.log('Departure:', parsedTravelData.departure || 'Not found');
  console.log('Arrival:', parsedTravelData.arrival || 'Not found');
  console.log('Departure Time:', parsedTravelData.departure_time || 'Not found');
  console.log('Arrival Time:', parsedTravelData.arrival_time || 'Not found');
  console.log('Duration:', parsedTravelData.duration || 'Not found');
  console.log('Airline:', parsedTravelData.airline || 'Not found');
  
  // Test the API response format
  console.log('\n🔄 SIMULATED API RESPONSE:');
  const apiResponse = {
    ...flight,
    ...parsedTravelData // This is what the frontend should receive
  };
  
  console.log('Final merged data for frontend:');
  console.log('- Name:', apiResponse.name);
  console.log('- Price:', apiResponse.price);
  console.log('- Departure:', apiResponse.departure);
  console.log('- Arrival:', apiResponse.arrival);
  console.log('- Departure Time:', apiResponse.departure_time);
  console.log('- Arrival Time:', apiResponse.arrival_time);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

console.log('\n✅ Debug completed!');