const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('=== LOCAL DATABASE ANALYSIS ===');
  
  // Check tables
  const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=?').all('table');
  console.log('Tables:', tables.map(t => t.name));
  
  // Check products
  try {
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    console.log('\nProducts count:', productCount.count);
    
    if (productCount.count > 0) {
      const sampleProducts = db.prepare('SELECT name, price, category FROM products LIMIT 5').all();
      console.log('Sample products:', sampleProducts);
    }
  } catch (e) {
    console.log('Products table error:', e.message);
  }
  
  // Check other important tables
  const importantTables = ['categories', 'announcements', 'blog_posts', 'widgets'];
  
  for (const table of importantTables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`${table} count:`, count.count);
    } catch (e) {
      console.log(`${table} error:`, e.message);
    }
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}