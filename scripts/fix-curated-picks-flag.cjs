/* Reset unintended product flag on 'Curated Picks' parent category */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

try {
  const res = db.prepare(
    "UPDATE categories SET is_for_products=0 WHERE parent_id IS NULL AND LOWER(name)='curated picks'"
  ).run();
  console.log('Updated rows:', res.changes);
} catch (e) {
  console.error('Failed to reset curated picks flag:', e.message);
  process.exitCode = 1;
} finally {
  db.close();
}