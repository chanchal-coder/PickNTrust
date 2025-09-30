const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('Stats Database Tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => console.log(`  - ${table.name}`));

console.log('\nSearch Checking click_picks_products table...');
try {
  const info = db.prepare('PRAGMA table_info(click_picks_products)').all();
  if (info.length > 0) {
    console.log('Success click_picks_products table exists:');
    info.forEach(column => {
      console.log(`   ${column.name}: ${column.type}`);
    });
  } else {
    console.log('Error click_picks_products table does not exist');
  }
} catch (error) {
  console.log('Error Error checking table:', error.message);
}

db.close();