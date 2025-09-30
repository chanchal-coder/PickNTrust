const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== CHECKING FIELD MAPPING ISSUE ===');

// Check what fields are actually in the database
db.all(`PRAGMA table_info(unified_content)`, (err, columns) => {
  if (err) {
    console.error('Error getting table info:', err);
    return;
  }
  
  console.log('\n📋 ACTUAL DATABASE COLUMNS:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  // Check what data is actually returned for services
  db.all(`
    SELECT id, title, price, original_price, discount, currency, pricing_type, monthly_price, yearly_price, is_free, price_description
    FROM unified_content 
    WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service')
    AND status = 'active'
    LIMIT 1
  `, (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('\n🔍 SAMPLE SERVICE DATA FROM DATABASE:');
    if (rows.length > 0) {
      const service = rows[0];
      console.log('Raw database fields:');
      Object.keys(service).forEach(key => {
        console.log(`  ${key}: ${service[key]}`);
      });
      
      console.log('\n🎯 FRONTEND EXPECTS THESE FIELD NAMES:');
      console.log('  - originalPrice (but DB has: original_price)');
      console.log('  - pricingType (but DB has: pricing_type)');
      console.log('  - monthlyPrice (but DB has: monthly_price)');
      console.log('  - yearlyPrice (but DB has: yearly_price)');
      console.log('  - isFree (but DB has: is_free)');
      console.log('  - priceDescription (but DB has: price_description)');
      
      console.log('\n💡 SOLUTION: Need to map database field names to frontend field names in API');
    } else {
      console.log('No services found in database');
    }
    
    db.close();
  });
});