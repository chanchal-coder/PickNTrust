const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('=== ALL TRAVEL TABLES ANALYSIS ===\n');

const tables = ['travel_deals', 'travel_picks_products', 'travel_categories'];

tables.forEach(table => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`${table}: ${count.count} records`);
    
    if (count.count > 0) {
      const sample = db.prepare(`SELECT * FROM ${table} LIMIT 2`).all();
      console.log('Sample data:');
      sample.forEach(row => {
        console.log('  ', row);
      });
    }
  } catch(e) {
    console.log(`${table}: ERROR - ${e.message}`);
  }
  console.log('---\n');
});

// Check what the current API is actually fetching
console.log('=== CURRENT API TEST ===');
try {
  const apiTables = ['products', 'amazon_products', 'cuelinks_products', 'value_picks_products', 'click_picks_products', 'travel_deals'];
  let totalFound = 0;
  
  apiTables.forEach(table => {
    try {
      const query = `SELECT COUNT(*) as count FROM ${table} WHERE LOWER(category) = 'travel'`;
      const result = db.prepare(query).get();
      if (result.count > 0) {
        console.log(`${table}: ${result.count} travel records`);
        totalFound += result.count;
        
        // Show sample data
        const sample = db.prepare(`SELECT id, name, category, subcategory FROM ${table} WHERE LOWER(category) = 'travel' LIMIT 1`).all();
        sample.forEach(row => console.log('  Sample:', row));
      }
    } catch (e) {
      console.log(`${table}: not accessible`);
    }
  });
  
  console.log(`\nTotal travel records API should find: ${totalFound}`);
} catch (e) {
  console.log('API test error:', e.message);
}

db.close();
console.log('\nDone.');