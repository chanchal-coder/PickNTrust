const axios = require('axios');

console.log('🎨 CHECKING FLIGHT CARD COLORS');
console.log('='.repeat(40));

async function checkCardColors() {
  try {
    console.log('\n📡 Fetching flight data...');
    const response = await axios.get('http://localhost:5000/api/travel-products/flights');
    
    console.log(`\n✅ Found ${response.data.length} flight cards`);
    
    response.data.forEach((flight, i) => {
      console.log(`\n🎫 Card ${i + 1}:`);
      console.log(`   Name: ${flight.name}`);
      console.log(`   Airline: ${flight.airline || 'Not specified'}`);
      console.log(`   Card Background: ${flight.card_background_color || 'Not specified'}`);
      console.log(`   Price: ₹${flight.price}`);
      console.log(`   ID: ${flight.id}`);
    });
    
    // Check if there are multiple cards with different backgrounds
    const backgrounds = response.data.map(f => f.card_background_color).filter(Boolean);
    const uniqueBackgrounds = [...new Set(backgrounds)];
    
    console.log('\n🔍 BACKGROUND ANALYSIS:');
    console.log(`   Total cards: ${response.data.length}`);
    console.log(`   Cards with background: ${backgrounds.length}`);
    console.log(`   Unique backgrounds: ${uniqueBackgrounds.length}`);
    console.log(`   Backgrounds found: ${uniqueBackgrounds.join(', ')}`);
    
    if (uniqueBackgrounds.length === 1) {
      console.log('\n⚠️  ISSUE: All cards have the same background color!');
      console.log('   This could be because:');
      console.log('   1. Only one card exists in database');
      console.log('   2. All cards were configured with same background');
      console.log('   3. Frontend is not using airline-specific colors');
    } else if (uniqueBackgrounds.length > 1) {
      console.log('\n✅ GOOD: Cards have different background colors');
    } else {
      console.log('\n❌ ISSUE: No background colors found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCardColors();