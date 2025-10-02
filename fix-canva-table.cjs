const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Adding missing default_title column to canva_settings table...');
  
  // Add the missing column
  db.exec('ALTER TABLE canva_settings ADD COLUMN default_title TEXT');
  
  console.log('Successfully added default_title column');
  
  // Verify the column was added
  const schema = db.prepare('PRAGMA table_info(canva_settings)').all();
  console.log('Updated canva_settings schema:');
  schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type}`);
  });
  
  db.close();
} catch (error) {
  console.error('Database error:', error);
}