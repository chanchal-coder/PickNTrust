const axios = require('axios');

console.log('🔍 DEBUGGING API TRAVEL_TYPE PARSING');
console.log('='.repeat(50));

async function debugAPI() {
  try {
    console.log('\n📡 Making API request...');
    const response = await axios.get('http://localhost:5000/api/travel-products/flights');
    
    if (response.data.length > 0) {
      const flight = response.data[0];
      
      console.log('\n📊 RAW API RESPONSE ANALYSIS:');
      console.log('Flight object keys:', Object.keys(flight));
      console.log('\nTravel type field:', flight.travel_type);
      
      // Try to parse the travel_type manually
      if (flight.travel_type) {
        try {
          const parsed = JSON.parse(flight.travel_type);
          console.log('\n✅ MANUAL PARSING SUCCESS:');
          console.log('Parsed keys:', Object.keys(parsed));
          console.log('Departure:', parsed.departure);
          console.log('Arrival:', parsed.arrival);
          console.log('Departure Time:', parsed.departure_time);
          console.log('Duration:', parsed.duration);
          
          // Check if these fields exist in the main flight object
          console.log('\n🔍 CHECKING IF FIELDS WERE MERGED:');
          console.log('flight.departure:', flight.departure);
          console.log('flight.arrival:', flight.arrival);
          console.log('flight.departure_time:', flight.departure_time);
          
          if (!flight.departure && parsed.departure) {
            console.log('\n❌ PROBLEM: API is not merging travel_type data!');
            console.log('The server-side parsing logic is not working.');
          }
          
        } catch (e) {
          console.log('\n❌ MANUAL PARSING FAILED:', e.message);
        }
      } else {
        console.log('\n❌ No travel_type field in API response');
      }
      
      // Show the complete flight object structure
      console.log('\n📋 COMPLETE FLIGHT OBJECT:');
      console.log(JSON.stringify(flight, null, 2));
      
    } else {
      console.log('❌ No flights returned from API');
    }
    
  } catch (error) {
    console.error('❌ API Debug Failed:', error.message);
  }
}

debugAPI();