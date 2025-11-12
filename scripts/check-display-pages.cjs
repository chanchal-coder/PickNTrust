// Count unified_content items per display_pages slug
// Usage: node scripts/check-display-pages.cjs
const path = require('path');
const Database = require('better-sqlite3');

const slugs = [
  'prime-picks','cue-picks','value-picks','click-picks','global-picks','travel-picks','deals-hub','loot-box','apps','apps-ai-apps','services','blog','videos','top-picks','home'
];

try {
  const dbFile = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbFile);

  console.log('Unified Content Page Tag Counts');
  console.log('--------------------------------');
  slugs.forEach(slug => {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE display_pages LIKE '%' || ? || '%' OR display_pages = ?`).get(slug, slug);
    console.log(`${slug.padEnd(14)} : ${String(row.c).padStart(4,' ')}`);
  });

  db.close();
} catch (err) {
  console.error('Error counting display_pages:', err);
  process.exit(1);
}