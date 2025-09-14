const Database = require('better-sqlite3');

console.log('🔍 CHECKING DATABASE SCHEMA');
console.log('='.repeat(40));

try {
  const db = new Database('./database.sqlite');
  
  console.log('\n📋 Travel products table schema:');
  const schema = db.prepare('PRAGMA table_info(travel_products)').all();
  schema.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });
  
  console.log('\n📊 Sample flight records:');
  const flights = db.prepare('SELECT * FROM travel_products WHERE category = ? LIMIT 2').all('flights');
  
  flights.forEach((flight, i) => {
    console.log(`\n🎫 Flight ${i + 1}:`);
    Object.keys(flight).forEach(key => {
      if (flight[key] !== null && flight[key] !== '') {
        const value = typeof flight[key] === 'string' && flight[key].length > 100 ? 
                     flight[key].substring(0, 100) + '...' : flight[key];
        console.log(`   ${key}: ${value}`);
      }
    });
  });
  
  console.log('\n🔍 Looking for airline information in travel_type field...');
  flights.forEach((flight, i) => {
    if (flight.travel_type) {
      try {
        const travelData = JSON.parse(flight.travel_type);
        console.log(`\n✈️  Flight ${i + 1} travel_type data:`);
        Object.keys(travelData).forEach(key => {
          console.log(`   ${key}: ${travelData[key]}`);
        });
      } catch (e) {
        console.log(`   Failed to parse travel_type for flight ${i + 1}`);
      }
    }
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}