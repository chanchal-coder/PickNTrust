const path = require('path');
const DB = require('better-sqlite3');

const db = new DB(path.join(__dirname, 'database.sqlite'));

try {
  console.log('=== Checking legacy products table for global-picks ===');
  const rows = db.prepare(
    "SELECT id, name, display_pages FROM products WHERE LOWER(display_pages) LIKE '%global-picks%' ORDER BY id DESC LIMIT 20"
  ).all();
  console.log(rows);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  db.close();
}