// Check unified_content column names
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING UNIFIED_CONTENT COLUMN NAMES');
console.log('========================================');

try {
  const tableInfo = db.prepare('PRAGMA table_info(unified_content)').all();
  console.log('Columns in unified_content table:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });

  // Check if there are any products with source_type set
  console.log('\nChecking products with source_type:');
  const sourceTypeProducts = db.prepare('SELECT id, title, source_type FROM unified_content WHERE source_type IS NOT NULL LIMIT 5').all();
  console.log(`Products with source_type: ${sourceTypeProducts.length}`);
  sourceTypeProducts.forEach(p => {
    console.log(`   ID ${p.id}: ${p.title} - source_type: ${p.source_type}`);
  });

  // Check if there are any products with source_platform set
  console.log('\nChecking products with source_platform:');
  const sourcePlatformProducts = db.prepare('SELECT id, title, source_platform FROM unified_content WHERE source_platform IS NOT NULL LIMIT 5').all();
  console.log(`Products with source_platform: ${sourcePlatformProducts.length}`);
  sourcePlatformProducts.forEach(p => {
    console.log(`   ID ${p.id}: ${p.title} - source_platform: ${p.source_platform}`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}