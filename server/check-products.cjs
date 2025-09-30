const Database = require('better-sqlite3');
const path = require('path');

// Try to find the database file
const dbPath = path.join(__dirname, '..', 'database.sqlite');
console.log('Looking for database at:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check if products table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Available tables:', tables.map(t => t.name));
  
  if (tables.some(t => t.name === 'products')) {
    // Get recent products
    const products = db.prepare('SELECT id, name, imageUrl FROM products ORDER BY id DESC LIMIT 10').all();
    console.log('\nRecent products:');
    products.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name}`);
      console.log(`Image: ${p.imageUrl || 'No image'}`);
      console.log('---');
    });
  } else {
    console.log('Products table does not exist');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}