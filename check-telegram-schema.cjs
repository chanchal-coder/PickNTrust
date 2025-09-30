const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Search Checking telegram_products table schema...');

try {
  const schema = db.prepare('PRAGMA table_info(telegram_products)').all();
  console.log('\n📋 telegram_products table columns:');
  schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type}`);
  });
  
  // Also check a sample record
  console.log('\nStats Sample record from telegram_products:');
  const sample = db.prepare('SELECT * FROM telegram_products WHERE id = 7 LIMIT 1').get();
  if (sample) {
    Object.keys(sample).forEach(key => {
      console.log(`${key}: ${sample[key]} (${typeof sample[key]})`);
    });
  } else {
    console.log('No record found with ID 7');
  }
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}