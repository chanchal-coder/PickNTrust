const Database = require('better-sqlite3');

console.log('=== SYNCING DATABASE DATA (SAFE MODE) ===\n');

// Open both databases
const rootDb = new Database('database.sqlite');
const serverDb = new Database('server/database.sqlite');

console.log('1. Checking current data:');
const rootCount = rootDb.prepare('SELECT COUNT(*) as count FROM unified_content').get();
const serverCount = serverDb.prepare('SELECT COUNT(*) as count FROM unified_content').get();
console.log(`Root database: ${rootCount.count} unified_content records`);
console.log(`Server database: ${serverCount.count} unified_content records`);

console.log('\n2. Comparing table schemas:');
const rootColumns = rootDb.prepare('PRAGMA table_info(unified_content)').all();
const serverColumns = serverDb.prepare('PRAGMA table_info(unified_content)').all();

const rootColumnNames = rootColumns.map(col => col.name);
const serverColumnNames = serverColumns.map(col => col.name);

console.log(`Root database columns (${rootColumnNames.length}):`, rootColumnNames.slice(0, 10).join(', '), '...');
console.log(`Server database columns (${serverColumnNames.length}):`, serverColumnNames.slice(0, 10).join(', '), '...');

// Find common columns
const commonColumns = rootColumnNames.filter(col => serverColumnNames.includes(col));
console.log(`Common columns (${commonColumns.length}):`, commonColumns.slice(0, 10).join(', '), '...');

console.log('\n3. Backing up root database data:');
const rootData = rootDb.prepare('SELECT * FROM unified_content').all();
console.log(`Backed up ${rootData.length} records from root database`);

console.log('\n4. Clearing root database unified_content:');
rootDb.prepare('DELETE FROM unified_content').run();
console.log('Root database unified_content cleared');

console.log('\n5. Copying data from server database (common columns only):');
const serverData = serverDb.prepare(`SELECT ${commonColumns.join(', ')} FROM unified_content`).all();

// Prepare insert statement for root database
const placeholders = commonColumns.map(() => '?').join(', ');
const insertQuery = `INSERT INTO unified_content (${commonColumns.join(', ')}) VALUES (${placeholders})`;
const insertStmt = rootDb.prepare(insertQuery);

// Copy each record
let copied = 0;
for (const record of serverData) {
  try {
    const values = commonColumns.map(col => record[col]);
    insertStmt.run(...values);
    copied++;
  } catch (error) {
    console.log(`Error copying record ${record.id}:`, error.message);
  }
}

console.log(`Successfully copied ${copied} records to root database`);

console.log('\n6. Verifying copy:');
const newRootCount = rootDb.prepare('SELECT COUNT(*) as count FROM unified_content').get();
console.log(`Root database now has: ${newRootCount.count} unified_content records`);

// Show sample data
console.log('\n7. Sample data in root database:');
const sampleData = rootDb.prepare(`
  SELECT id, title, category, processing_status, visibility, status 
  FROM unified_content 
  LIMIT 5
`).all();
console.table(sampleData);

console.log('\n8. Testing API query on updated root database:');
const apiQuery = `
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

const apiResult = rootDb.prepare(apiQuery).all();
console.table(apiResult);

rootDb.close();
serverDb.close();

console.log('\n✅ Database sync completed!');