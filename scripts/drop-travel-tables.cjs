// Optional cleanup: drop travel-specific legacy tables so they can be recreated cleanly
// Usage:
//   node scripts/drop-travel-tables.cjs          -> shows what would be dropped (no changes)
//   node scripts/drop-travel-tables.cjs --apply  -> actually drops the tables

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const apply = process.argv.includes('--apply');

const tablesToDrop = ['travel_categories', 'travel_products'];

function main() {
  const db = new Database(dbPath);
  try {
    const existing = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const candidates = tablesToDrop.filter(t => existing.includes(t));

    console.log(`Database: ${dbPath}`);
    console.log('Existing tables:', existing.join(', '));
    console.log('Candidates to drop:', candidates.join(', ') || '(none)');

    if (!apply) {
      console.log('\nDry-run only. Re-run with --apply to drop these tables.');
      return;
    }

    for (const t of candidates) {
      console.log(`Dropping table: ${t}`);
      db.exec(`DROP TABLE IF EXISTS ${t}`);
    }
    console.log('✅ Drop complete. Travel bot will recreate tables on next start.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    db.close();
  }
}

main();