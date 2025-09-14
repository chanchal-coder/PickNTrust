const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('=== CHECKING HOTEL DATA ===\n');

try {
  // Check if travel_products table exists and get count
  const countResult = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`Total records in travel_products: ${countResult.count}`);
  
  if (countResult.count > 0) {
    console.log('\n=== SAMPLE TRAVEL PRODUCTS ===');
    const sampleData = db.prepare('SELECT * FROM travel_products LIMIT 5').all();
    sampleData.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(JSON.stringify(record, null, 2));
    });
    
    // Check specifically for hotel category
    const hotelData = db.prepare("SELECT * FROM travel_products WHERE category = 'hotels' OR category = 'Hotels'").all();
    console.log(`\n=== HOTEL RECORDS ===`);
    console.log(`Found ${hotelData.length} hotel records`);
    
    if (hotelData.length > 0) {
      hotelData.forEach((record, index) => {
        console.log(`\nHotel ${index + 1}:`);
        console.log(`Name: ${record.name}`);
        console.log(`Category: ${record.category}`);
        console.log(`Price: ${record.price}`);
        console.log(`Created: ${record.createdAt}`);
      });
    }
  } else {
    console.log('No records found in travel_products table.');
  }
  
} catch (error) {
  console.error('Error checking travel_products:', error.message);
}

// Also check if there are any other tables that might contain travel data
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%travel%'").all();
  console.log('\n=== TRAVEL-RELATED TABLES ===');
  tables.forEach(table => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`${table.name}: ${count.count} records`);
    } catch (err) {
      console.log(`${table.name}: Error - ${err.message}`);
    }
  });
} catch (error) {
  console.error('Error checking tables:', error.message);
}

db.close();
console.log('\nDone.');