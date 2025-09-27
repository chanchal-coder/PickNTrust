const Database = require('better-sqlite3');

try {
  // Check both database files
  const databases = [
    { name: 'Root database', path: './database.sqlite' },
    { name: 'Server database', path: './server/database.sqlite' }
  ];
  
  databases.forEach(({ name, path }) => {
    console.log(`\n📊 Checking ${name} at ${path}...`);
    
    try {
      const db = new Database(path);
      
      // List all tables
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('All tables:', tables.map(t => t.name));
      
      // Check if ad_placements exists
      const adPlacementsExists = tables.some(t => t.name === 'ad_placements');
      console.log('ad_placements table exists:', adPlacementsExists);
      
      if (adPlacementsExists) {
        const count = db.prepare('SELECT COUNT(*) as count FROM ad_placements').get();
        console.log('Ad placements count:', count.count);
        
        // Show sample data
        const sample = db.prepare('SELECT * FROM ad_placements LIMIT 3').all();
        console.log('Sample ad placements:', sample);
      }
      
      db.close();
    } catch (error) {
      console.error(`Error with ${name}:`, error.message);
    }
  });
} catch (error) {
  console.error('Error:', error);
}