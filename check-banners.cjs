const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  // Check if banners table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'").all();
  console.log('Banner table exists:', tables.length > 0);
  
  if (tables.length > 0) {
    // Get table schema
    const schema = db.prepare('PRAGMA table_info(banners)').all();
    console.log('Banner table schema:', schema);
    
    // Get sample data
    const banners = db.prepare('SELECT * FROM banners LIMIT 5').all();
    console.log('Sample banners:', JSON.stringify(banners, null, 2));
    
    // Count by page
    const counts = db.prepare('SELECT page, COUNT(*) as count FROM banners GROUP BY page').all();
    console.log('Banners by page:', counts);
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}