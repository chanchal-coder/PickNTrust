const Database = require('better-sqlite3');

console.log('🎨 FIXING INDIGO CARD COLOR');
console.log('='.repeat(40));

try {
  const db = new Database('./database.sqlite');
  
  console.log('\n📋 Current IndiGo flight:');
  const indigoFlight = db.prepare('SELECT id, name, travel_type FROM travel_products WHERE name LIKE ?').get('%IndiGo%');
  
  if (indigoFlight) {
    console.log(`   ID: ${indigoFlight.id}`);
    console.log(`   Name: ${indigoFlight.name}`);
    
    const travelData = JSON.parse(indigoFlight.travel_type);
    console.log(`   Current background: ${travelData.card_background_color}`);
    console.log(`   Airline: ${travelData.airline}`);
    
    // Remove card_background_color so it uses airline-specific color
    delete travelData.card_background_color;
    
    console.log('\n🔧 Removing card_background_color to use airline-specific blue...');
    const updatedTravelType = JSON.stringify(travelData);
    
    const result = db.prepare('UPDATE travel_products SET travel_type = ? WHERE id = ?').run(updatedTravelType, indigoFlight.id);
    console.log(`   Updated ${result.changes} row(s)`);
    
    console.log('\n✅ IndiGo flight updated:');
    const updatedFlight = db.prepare('SELECT travel_type FROM travel_products WHERE id = ?').get(indigoFlight.id);
    const updatedData = JSON.parse(updatedFlight.travel_type);
    console.log(`   Background: ${updatedData.card_background_color || 'Will use airline-specific blue (from-blue-400 to-blue-500)'}`);
    console.log(`   Airline: ${updatedData.airline}`);
    
    console.log('\n🎯 Expected result:');
    console.log('   - IndiGo card: Blue gradient (airline-specific)');
    console.log('   - Akasa Air card: Orange gradient (from travel_type)');
    console.log('   - Cards should now have different colors!');
    
  } else {
    console.log('   ❌ IndiGo flight not found');
  }
  
  db.close();
  console.log('\n✅ Database updated successfully!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}