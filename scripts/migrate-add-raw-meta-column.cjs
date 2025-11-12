const Database = require('better-sqlite3');

function hasColumn(db, table, column) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  return info.some(col => col.name === column);
}

function main() {
  const db = new Database('./database.sqlite');
  try {
    const exists = hasColumn(db, 'meta_tags', 'raw_html');
    if (exists) {
      console.log('✅ Column raw_html already exists in meta_tags');
      return;
    }
    db.prepare('ALTER TABLE meta_tags ADD COLUMN raw_html TEXT DEFAULT NULL').run();
    console.log('✅ Added raw_html column to meta_tags');
  } catch (err) {
    console.error('❌ Failed to add raw_html column:', err);
    process.exitCode = 1;
  } finally {
    try { db.close(); } catch {}
  }
}

main();