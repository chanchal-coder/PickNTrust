const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Ensuring unified_content has all required columns for simulation');
console.log('Database:', dbPath);

try {
  const tableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  const existing = new Set(tableInfo.map(c => c.name));

  const needed = [
    { name: 'source_type', ddl: 'source_type TEXT' },
    { name: 'source_id', ddl: 'source_id TEXT' },
    { name: 'affiliate_platform', ddl: 'affiliate_platform TEXT' },
    { name: 'rating', ddl: 'rating TEXT' },
    { name: 'review_count', ddl: 'review_count INTEGER' },
    { name: 'currency', ddl: "currency TEXT DEFAULT 'INR'" },
    { name: 'display_order', ddl: 'display_order INTEGER DEFAULT 0' },
    { name: 'has_timer', ddl: 'has_timer INTEGER DEFAULT 0' },
    { name: 'timer_duration', ddl: 'timer_duration INTEGER' },
    { name: 'timer_start_time', ddl: 'timer_start_time INTEGER' }
  ];

  const toAdd = needed.filter(col => !existing.has(col.name));

  if (toAdd.length === 0) {
    console.log('✅ All required columns already exist');
  } else {
    console.log('➕ Adding missing columns:', toAdd.map(c => c.name).join(', '));
    for (const col of toAdd) {
      try {
        db.exec(`ALTER TABLE unified_content ADD COLUMN ${col.ddl}`);
        console.log(`  ✅ Added ${col.name}`);
      } catch (err) {
        console.log(`  ❌ Failed to add ${col.name}:`, err.message);
      }
    }
  }

  // Show final schema summary
  const updated = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('\n📋 Final unified_content columns:');
  updated.forEach(c => {
    const nullable = c.notnull === 0 ? 'NULL' : 'NOT NULL';
    const def = c.dflt_value ? ` DEFAULT ${c.dflt_value}` : '';
    console.log(`  - ${c.name}: ${c.type} ${nullable}${def}`);
  });

  console.log('\n✅ Schema ensure complete');
} catch (error) {
  console.error('❌ Error ensuring columns:', error.message);
} finally {
  db.close();
}