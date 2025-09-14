const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('Refresh Running category migration...');
console.log('Database path:', dbPath);

try {
  // Connect to database
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log('Success Connected to database');

  // Add the new columns to categories table
  console.log('Blog Adding isForProducts column...');
  sqlite.exec(`
    ALTER TABLE categories 
    ADD COLUMN isForProducts INTEGER DEFAULT 1;
  `);

  console.log('Blog Adding isForServices column...');
  sqlite.exec(`
    ALTER TABLE categories 
    ADD COLUMN isForServices INTEGER DEFAULT 0;
  `);

  // Update existing categories to have proper defaults
  console.log('Refresh Updating existing categories with default values...');
  sqlite.exec(`
    UPDATE categories 
    SET isForProducts = 1, isForServices = 0 
    WHERE isForProducts IS NULL OR isForServices IS NULL;
  `);

  console.log('Success Category migration completed successfully!');
  console.log('Stats Categories now support product/service filtering');

  // Verify the changes
  const result = sqlite.prepare(`
    SELECT name, isForProducts, isForServices 
    FROM categories 
    LIMIT 5
  `).all();

  console.log('📋 Sample categories after migration:');
  console.table(result);

  sqlite.close();
  console.log('Celebration Migration completed successfully!');

} catch (error) {
  console.error('Error Migration failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
