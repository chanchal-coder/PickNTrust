// Quick audit of nav_tabs content
// Usage: node scripts/check-nav-tabs.cjs
const path = require('path');
const Database = require('better-sqlite3');

function fmt(n) { return String(n).padStart(2, ' '); }

try {
  const dbFile = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbFile);

  const rows = db.prepare(`SELECT id, name, slug, is_active, display_order FROM nav_tabs ORDER BY display_order ASC, id ASC`).all();
  console.log(`\nnav_tabs count: ${rows.length}`);
  rows.forEach(r => {
    console.log(`${fmt(r.display_order)}. ${r.slug} | ${r.name} | active=${r.is_active}`);
  });

  const missing = [];
  const expected = ['prime-picks','cue-picks','value-picks','click-picks','deals-hub','global-picks','travel-picks','loot-box'];
  const slugs = new Set(rows.map(r => String(r.slug)));
  expected.forEach(s => { if (!slugs.has(s)) missing.push(s); });
  if (missing.length > 0) {
    console.log(`\nMissing expected tabs: ${missing.join(', ')}`);
  } else {
    console.log(`\nAll expected tabs present.`);
  }

  db.close();
} catch (err) {
  console.error('Error auditing nav_tabs:', err);
  process.exit(1);
}