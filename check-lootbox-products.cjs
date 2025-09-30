// Check Loot Box Products in Database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Search Checking loot_box_products table...');

// Check if table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='loot_box_products'", (err, row) => {
  if (err) {
    console.error('Error Error checking table:', err);
    return;
  }
  
  if (!row) {
    console.log('Warning loot_box_products table does not exist');
    db.close();
    return;
  }
  
  console.log('Success loot_box_products table exists');
  
  // First check table schema
  db.all("PRAGMA table_info(loot_box_products)", (err, columns) => {
    if (err) {
      console.error('Error Error getting table schema:', err);
      db.close();
      return;
    }
    
    console.log('\n📋 Table schema:');
    columns.forEach(col => {
      console.log(`   ${col.name} (${col.type})`);
    });
    
    // Get recent products with correct column names
     db.all(`
       SELECT *
       FROM loot_box_products 
       ORDER BY created_at DESC 
       LIMIT 10
     `, (err, rows) => {
    if (err) {
      console.error('Error Error querying products:', err);
      db.close();
      return;
    }
    
    console.log(`\nStats Found ${rows.length} products in loot_box_products table:`);
    
    if (rows.length === 0) {
      console.log('Warning No products found in loot_box_products table');
      console.log('\n🔧 This means either:');
      console.log('1. No messages with URLs were sent to @deodappnt channel');
      console.log('2. Bot is not receiving messages from the channel');
      console.log('3. Message processing failed');
    } else {
      rows.forEach((product, index) => {
        console.log(`\n${index + 1}. Product ID: ${product.id}`);
        console.log(`   Name: ${product.name || 'N/A'}`);
        console.log(`   Original URL: ${product.originalUrl || 'N/A'}`);
        console.log(`   Affiliate URL: ${product.affiliateUrl || 'N/A'}`);
        console.log(`   Category: ${product.category || 'N/A'}`);
        console.log(`   Status: ${product.processingStatus || 'N/A'}`);
        console.log(`   Created: ${new Date(product.createdAt * 1000).toLocaleString()}`);
      });
    }
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM loot_box_products', (err, countRow) => {
      if (!err && countRow) {
        console.log(`\n📈 Total products in loot_box_products: ${countRow.total}`);
      }
      
      db.close();
      console.log('\nSuccess Database check complete');
    });
  });
  });
});