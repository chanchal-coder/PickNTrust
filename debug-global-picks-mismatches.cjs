// Quick diagnostic for display_pages mismatches around the Global Picks slug
const path = require('path');
const DB = require('better-sqlite3');

function openDb() {
  // Server resolves to root-level database.sqlite
  const dbPath = path.join(__dirname, 'database.sqlite');
  return new DB(dbPath);
}

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(Array.isArray(data) ? JSON.stringify(data, null, 2) : data);
}

function main() {
  const db = openDb();

  // Count items that correctly include 'global-picks'
  const correctCount = db
    .prepare(
      "SELECT COUNT(1) as cnt FROM unified_content WHERE LOWER(display_pages) LIKE '%global-picks%'"
    )
    .get();
  log('Correct slug count (global-picks)', correctCount);

  // Find likely mismatches: 'global picks', 'globalpicks', or loose 'global' + 'picks'
  const mismatchRows = db
    .prepare(
      "SELECT id, title, display_pages, status, visibility, processing_status FROM unified_content " +
        "WHERE LOWER(display_pages) LIKE '%global picks%' " +
        "OR LOWER(display_pages) LIKE '%globalpicks%' " +
        "OR LOWER(display_pages) LIKE '%global%picks%' " +
        "ORDER BY id DESC LIMIT 50"
    )
    .all();
  log('Potential mismatches (space/combined/loose)', mismatchRows);

  // Show a few correct examples for comparison
  const correctRows = db
    .prepare(
      "SELECT id, title, display_pages, status, visibility, processing_status FROM unified_content " +
        "WHERE LOWER(display_pages) LIKE '%global-picks%' ORDER BY id DESC LIMIT 10"
    )
    .all();
  log('Sample correct rows', correctRows);

  db.close();
}

main();