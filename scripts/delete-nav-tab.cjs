// Delete a navigation tab by slug (default 'aaa')
// Usage: node scripts/delete-nav-tab.cjs [slug]
const path = require('path');
const Database = require('better-sqlite3');

try {
  const slug = process.argv[2] || 'aaa';
  const dbFile = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbFile);

  const exists = db.prepare(`SELECT COUNT(*) AS c FROM nav_tabs WHERE slug = ?`).get(slug).c;
  if (exists > 0) {
    const res = db.prepare(`DELETE FROM nav_tabs WHERE slug = ?`).run(slug);
    console.log(`Deleted nav_tab '${slug}', changes=${res.changes}`);
  } else {
    console.log(`No nav_tab found for slug '${slug}', nothing to delete.`);
  }

  db.close();
} catch (err) {
  console.error('Error deleting nav_tab:', err);
  process.exit(1);
}