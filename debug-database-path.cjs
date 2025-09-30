const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('=== DEBUGGING DATABASE PATH ISSUE ===\n');

// Check which database files exist
const rootDb = path.join(__dirname, 'database.sqlite');
const serverDb = path.join(__dirname, 'server', 'database.sqlite');
const sqliteDb = path.join(__dirname, 'sqlite.db');

console.log('1. Checking database file existence:');
console.log(`Root database.sqlite: ${fs.existsSync(rootDb) ? 'EXISTS' : 'NOT FOUND'}`);
console.log(`Server database.sqlite: ${fs.existsSync(serverDb) ? 'EXISTS' : 'NOT FOUND'}`);
console.log(`sqlite.db: ${fs.existsSync(sqliteDb) ? 'EXISTS' : 'NOT FOUND'}`);

// The server uses: path.join(__dirname, '../database.sqlite')
// From server directory, this would be the root database.sqlite
const serverUsesPath = path.join(__dirname, 'server', '..', 'database.sqlite');
console.log(`\nServer uses path: ${serverUsesPath}`);
console.log(`Resolved to: ${path.resolve(serverUsesPath)}`);
console.log(`This file exists: ${fs.existsSync(serverUsesPath) ? 'YES' : 'NO'}`);

// Test the exact database the server is using
if (fs.existsSync(serverUsesPath)) {
  console.log('\n2. Testing server database content:');
  const db = new Database(serverUsesPath);
  
  // Check categories
  const categories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  console.log(`Categories count: ${categories.count}`);
  
  // Check unified_content
  const content = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
  console.log(`Unified content count: ${content.count}`);
  
  // Test the exact API query
  console.log('\n3. Testing API query on server database:');
  const query = `
    SELECT 
      c.id,
      c.name,
      COUNT(uc.id) as total_products_count
    FROM categories c
    INNER JOIN unified_content uc ON (
      uc.category = c.name 
      OR uc.category = REPLACE(c.name, 's', '')
      OR uc.category = c.name || 's'
      OR (c.name = 'Technology Services' AND uc.category = 'Technology Service')
      OR (c.name = 'AI Photo Apps' AND uc.category = 'AI Photo App')
      OR (c.name = 'AI Applications' AND uc.category = 'AI App')
    )
    WHERE c.parent_id IS NULL
      AND uc.processing_status = 'completed'
      AND uc.visibility = 'public'
      AND uc.status = 'active'
    GROUP BY c.id, c.name
    HAVING COUNT(uc.id) > 0
    ORDER BY c.name ASC
  `;
  
  const result = db.prepare(query).all();
  console.table(result);
  
  db.close();
} else {
  console.log('\nError: Server database file not found!');
}

console.log('\n4. Checking all database files for unified_content:');
[rootDb, serverDb, sqliteDb].forEach(dbPath => {
  if (fs.existsSync(dbPath)) {
    try {
      const db = new Database(dbPath);
      const count = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
      console.log(`${path.basename(dbPath)}: ${count.count} unified_content records`);
      db.close();
    } catch (error) {
      console.log(`${path.basename(dbPath)}: Error - ${error.message}`);
    }
  }
});