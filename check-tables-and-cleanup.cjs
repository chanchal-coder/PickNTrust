const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 Checking Database Tables and Sample Data...');
console.log('=' .repeat(60));

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('\n📋 Available tables:');
tables.forEach(t => console.log('- ' + t.name));

// Check for test/sample data in main tables
const testDataQueries = [
  {
    table: 'products',
    query: "SELECT COUNT(*) as count FROM products WHERE name LIKE '%TEST%' OR name LIKE '%ERROR%' OR name LIKE '%SAMPLE%' OR name LIKE '%FIX%'"
  },
  {
    table: 'featured_products', 
    query: "SELECT COUNT(*) as count FROM featured_products WHERE name LIKE '%TEST%' OR name LIKE '%ERROR%' OR name LIKE '%SAMPLE%' OR name LIKE '%FIX%'"
  },
  {
    table: 'top_picks_products',
    query: "SELECT COUNT(*) as count FROM top_picks_products WHERE name LIKE '%TEST%' OR name LIKE '%ERROR%' OR name LIKE '%SAMPLE%' OR name LIKE '%FIX%'"
  }
];

console.log('\n🧪 Checking for test/sample data:');
testDataQueries.forEach(({table, query}) => {
  try {
    const result = db.prepare(query).get();
    console.log(`- ${table}: ${result.count} test/sample records`);
    
    if (result.count > 0) {
      // Show sample test data
      const sampleQuery = query.replace('COUNT(*) as count', '*').replace('FROM', 'FROM') + ' LIMIT 3';
      const samples = db.prepare(sampleQuery).all();
      console.log('  Sample test records:');
      samples.forEach(sample => {
        console.log(`    • ${sample.name}`);
      });
    }
  } catch (error) {
    console.log(`- ${table}: Table not found or error - ${error.message}`);
  }
});

// Check bot tables
const botTables = [
  'amazon_products',
  'cuelinks_products', 
  'value_picks_products',
  'click_picks_products',
  'global_picks_products',
  'travel_products',
  'deals_hub_products',
  'lootbox_products',
  'apps_products'
];

console.log('\n🤖 Bot tables status:');
botTables.forEach(tableName => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`- ${tableName}: ${count.count} records`);
  } catch (error) {
    console.log(`- ${tableName}: Table not found`);
  }
});

db.close();

console.log('\n✅ Database inspection complete!');
console.log('\n💡 Next steps:');
console.log('1. Run comprehensive cleanup if test data found');
console.log('2. Verify all sample/test products are removed');
console.log('3. Check website pages for clean data');