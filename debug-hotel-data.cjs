const axios = require('axios');

console.log('🏨 DEBUGGING HOTEL CARD DATA ISSUES');
console.log('='.repeat(50));

async function debugHotelData() {
  try {
    console.log('\n📡 Fetching hotel data from API...');
    const response = await axios.get('http://localhost:5000/api/travel-products/hotels');
    
    console.log(`\n✅ Found ${response.data.length} hotel records`);
    
    if (response.data.length > 0) {
      const hotel = response.data[0];
      
      console.log('\n🏨 FIRST HOTEL RECORD ANALYSIS:');
      console.log('==============================');
      console.log('📋 BASIC INFO:');
      console.log(`   ID: ${hotel.id}`);
      console.log(`   Name: ${hotel.name}`);
      console.log(`   Price: ${hotel.price}`);
      console.log(`   Original Price: ${hotel.original_price}`);
      console.log(`   Currency: ${hotel.currency}`);
      
      console.log('\n💰 PRICE ANALYSIS:');
      console.log(`   Raw price field: "${hotel.price}"`);
      console.log(`   Price type: ${typeof hotel.price}`);
      console.log(`   parseFloat(price): ${parseFloat(hotel.price)}`);
      console.log(`   parseFloat(price.replace(/,/g, '')): ${parseFloat(hotel.price.replace(/,/g, ''))}`);
      
      console.log('\n🎨 STYLING ANALYSIS:');
      console.log(`   Field colors (raw): ${hotel.field_colors || 'Not set'}`);
      console.log(`   Field styles (raw): ${hotel.field_styles || 'Not set'}`);
      console.log(`   Card background: ${hotel.card_background_color || 'Not set'}`);
      
      console.log('\n🏨 HOTEL-SPECIFIC DATA:');
      console.log(`   Location: ${hotel.location || 'Not set'}`);
      console.log(`   Hotel Type: ${hotel.hotel_type || 'Not set'}`);
      console.log(`   Room Type: ${hotel.room_type || 'Not set'}`);
      console.log(`   Rating: ${hotel.rating || 'Not set'}`);
      console.log(`   Amenities: ${hotel.amenities || 'Not set'}`);
      console.log(`   Cancellation: ${hotel.cancellation || 'Not set'}`);
      
      console.log('\n🔍 TRAVEL_TYPE JSON ANALYSIS:');
      if (hotel.travel_type) {
        try {
          const travelData = JSON.parse(hotel.travel_type);
          console.log('   Parsed travel_type data:');
          Object.keys(travelData).forEach(key => {
            console.log(`     ${key}: ${travelData[key]}`);
          });
        } catch (e) {
          console.log(`   ❌ Failed to parse travel_type: ${e.message}`);
        }
      } else {
        console.log('   ❌ No travel_type data found');
      }
      
      console.log('\n🚨 POTENTIAL ISSUES IDENTIFIED:');
      const issues = [];
      
      if (!hotel.price || hotel.price === '0' || parseFloat(hotel.price.replace(/,/g, '')) < 10) {
        issues.push('Price is missing, zero, or suspiciously low');
      }
      
      if (!hotel.location && !hotel.travel_type) {
        issues.push('Location data missing from both main fields and travel_type');
      }
      
      if (!hotel.field_colors && !hotel.field_styles) {
        issues.push('No custom styling configured');
      }
      
      if (issues.length > 0) {
        issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      } else {
        console.log('   ✅ No obvious issues detected');
      }
    } else {
      console.log('\n❌ No hotel data found in API response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugHotelData();