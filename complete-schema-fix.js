const sqlite3 = require('better-sqlite3');

// Connect to the database
const db = new sqlite3('sqlite.db');

try {
  console.log('🔍 Checking current database schema...');
  
  // Check products table structure
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const columns = tableInfo.map(col => col.name);
  
  console.log('Current columns:', columns);
  
  // Add missing affiliate_network_id column if not exists
  if (!columns.includes('affiliate_network_id')) {
    console.log('➕ Adding affiliate_network_id column...');
    db.prepare(`
      ALTER TABLE products ADD COLUMN affiliate_network_id INTEGER 
      REFERENCES affiliate_networks(id)
    `).run();
    console.log('✅ affiliate_network_id column added');
  }
  
  // Add new affiliate_network_name column for custom names
  if (!columns.includes('affiliate_network_name')) {
    console.log('➕ Adding affiliate_network_name column...');
    db.prepare(`
      ALTER TABLE products ADD COLUMN affiliate_network_name TEXT
    `).run();
    console.log('✅ affiliate_network_name column added');
  }
  
  // Verify the changes
  const updatedTableInfo = db.prepare("PRAGMA table_info(products)").all();
  console.log('Updated columns:', updatedTableInfo.map(col => col.name));
  
  console.log('🎉 Database schema updated successfully!');
  
} catch (error) {
  console.error('❌ Error updating schema:', error.message);
} finally {
  db.close();
}
