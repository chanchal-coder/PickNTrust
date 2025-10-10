const path = require('path');
const Database = require('better-sqlite3');

// Usage: node scripts/migrate-unified-content.cjs [path/to/database.sqlite]
const dbPath = process.argv[2] || path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

function hasColumn(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

function addColumnIfMissing(table, column, definitionSql) {
  if (hasColumn(table, column)) {
    console.log(`Skipping: ${column} (already exists)`);
    return;
  }
  db.prepare(definitionSql).run();
  console.log(`Added: ${column}`);
}

const table = 'unified_content';

// Columns to ensure exist (aligned with app expectations)
addColumnIfMissing(table, 'source_id', `ALTER TABLE ${table} ADD COLUMN source_id TEXT`);
addColumnIfMissing(table, 'source_type', `ALTER TABLE ${table} ADD COLUMN source_type TEXT`);
addColumnIfMissing(table, 'affiliate_platform', `ALTER TABLE ${table} ADD COLUMN affiliate_platform TEXT`);
addColumnIfMissing(table, 'rating', `ALTER TABLE ${table} ADD COLUMN rating TEXT`);
addColumnIfMissing(table, 'review_count', `ALTER TABLE ${table} ADD COLUMN review_count INTEGER`);
addColumnIfMissing(table, 'currency', `ALTER TABLE ${table} ADD COLUMN currency TEXT`);
addColumnIfMissing(table, 'gender', `ALTER TABLE ${table} ADD COLUMN gender TEXT`);
addColumnIfMissing(table, 'display_order', `ALTER TABLE ${table} ADD COLUMN display_order INTEGER DEFAULT 0`);
addColumnIfMissing(table, 'content', `ALTER TABLE ${table} ADD COLUMN content TEXT`);
addColumnIfMissing(table, 'has_timer', `ALTER TABLE ${table} ADD COLUMN has_timer INTEGER DEFAULT 0`);
addColumnIfMissing(table, 'timer_duration', `ALTER TABLE ${table} ADD COLUMN timer_duration INTEGER`);
addColumnIfMissing(table, 'timer_start_time', `ALTER TABLE ${table} ADD COLUMN timer_start_time TEXT`);

console.log('\nSchema after migration (name | type | default):');
const info = db.prepare(`PRAGMA table_info(${table})`).all();
for (const r of info) {
  console.log(`${r.name} | ${r.type} | ${r.dflt_value ?? ''}`);
}

db.close();