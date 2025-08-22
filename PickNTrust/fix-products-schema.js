const sqlite3 = require('better-sqlite3');
const path = require('path');

// Connect to the database
const db = new sqlite3('sqlite.db');

try {
  console.log('Checking products table structure...');
  
  // Check if the column exists
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const hasAffiliateNetworkId = tableInfo.some(col => col.name === 'affiliate_network_id');
  
  if (!hasAffiliateNetworkId) {
    console.log('Adding affiliate_network_id column to products table...');
    
    // Add the missing column
    db.prepare(`
      ALTER TABLE products ADD COLUMN affiliate_network_id INTEGER 
      REFERENCES affiliate_networks(id)
    `).run();
    
    console.log('✅ Successfully added affiliate_network_id column');
  } else {
    console.log('✅ affiliate_network_id column already exists');
  }
  
  // Verify the change
  const updatedTableInfo = db.prepare("PRAGMA table_info(products)").all();
  console.log('Updated table structure:', updatedTableInfo.map(col => col.name));
  
} catch (error) {
  console.error('Error updating schema:', error.message);
} finally {
  db.close();
}
