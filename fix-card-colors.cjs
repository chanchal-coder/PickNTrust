const Database = require('better-sqlite3');

console.log('🎨 FIXING FLIGHT CARD COLORS');
console.log('='.repeat(40));

try {
  const db = new Database('./database.sqlite');
  
  console.log('\n📋 Current flight cards:');
  const currentFlights = db.prepare('SELECT id, name, airline, card_background_color FROM travel_products WHERE category = "flights"').all();
  currentFlights.forEach(f => {
    console.log(`   ${f.name} (${f.airline || 'No airline'}): ${f.card_background_color || 'No background set'}`);
  });
  
  console.log('\n🔧 Clearing IndiGo card background to use airline-specific blue color...');
  const result = db.prepare('UPDATE travel_products SET card_background_color = NULL WHERE airline = ?').run('IndiGo');
  console.log(`   Updated ${result.changes} row(s)`);
  
  console.log('\n✅ Updated flight cards:');
  const updatedFlights = db.prepare('SELECT id, name, airline, card_background_color FROM travel_products WHERE category = "flights"').all();
  updatedFlights.forEach(f => {
    const expectedColor = f.airline?.toLowerCase().includes('indigo') ? 'Blue (from-blue-400 to-blue-500)' : 
                         f.airline?.toLowerCase().includes('akasa') ? 'Orange (from-orange-400 to-orange-500)' :
                         f.card_background_color || 'Orange (default)';
    console.log(`   ${f.name} (${f.airline || 'No airline'}): ${expectedColor}`);
  });
  
  console.log('\n🎯 Expected result:');
  console.log('   - IndiGo card: Blue gradient (airline-specific)');
  console.log('   - Akasa Air card: Orange gradient (stored or default)');
  console.log('   - Cards should now have different colors!');
  
  db.close();
  console.log('\n✅ Database updated successfully!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}