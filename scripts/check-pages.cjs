// Quick audit of unified_content services/apps tagging coverage
// Usage: node scripts/check-pages.cjs
const path = require('path');
const Database = require('better-sqlite3');

function fmt(n) { return String(n).padStart(6, ' '); }

try {
  const dbFile = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbFile);

  const counts = {
    total: db.prepare(`SELECT COUNT(*) AS c FROM unified_content`).get().c,
    services_flag: db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE is_service = 1`).get().c,
    services_page: db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE display_pages LIKE '%"services"%'`).get().c,
    apps_flag: db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE is_ai_app = 1`).get().c,
    apps_page: db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE display_pages LIKE '%"apps-ai-apps"%'`).get().c,
    services_ct: db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE LOWER(content_type) = 'service'`).get().c,
    apps_ct: db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE LOWER(content_type) IN ('app','ai-app')`).get().c,
  };

  console.log('\nUnified Content Tag Coverage');
  console.log('--------------------------------');
  console.log(`Total records           : ${fmt(counts.total)}`);
  console.log(`Services flag (is_service=1): ${fmt(counts.services_flag)}`);
  console.log(`Services page ("services") : ${fmt(counts.services_page)}`);
  console.log(`Services content_type    : ${fmt(counts.services_ct)}`);
  console.log(`Apps flag (is_ai_app=1)  : ${fmt(counts.apps_flag)}`);
  console.log(`Apps page ("apps-ai-apps"): ${fmt(counts.apps_page)}`);
  console.log(`Apps content_type        : ${fmt(counts.apps_ct)}`);

  // Identify mismatches for visibility
  const serviceMismatches = db.prepare(`
    SELECT id, title, display_pages, is_service, content_type
    FROM unified_content
    WHERE is_service = 1 AND (display_pages IS NULL OR display_pages NOT LIKE '%"services"%')
    ORDER BY id DESC LIMIT 10
  `).all();
  const appMismatches = db.prepare(`
    SELECT id, title, display_pages, is_ai_app, content_type
    FROM unified_content
    WHERE is_ai_app = 1 AND (display_pages IS NULL OR display_pages NOT LIKE '%"apps-ai-apps"%')
    ORDER BY id DESC LIMIT 10
  `).all();

  console.log('\nSample service mismatches (up to 10):');
  if (serviceMismatches.length === 0) console.log('  None');
  serviceMismatches.forEach(r => {
    console.log(`  #${r.id} ${r.title} | ct=${r.content_type} | pages=${r.display_pages}`);
  });

  console.log('\nSample app mismatches (up to 10):');
  if (appMismatches.length === 0) console.log('  None');
  appMismatches.forEach(r => {
    console.log(`  #${r.id} ${r.title} | ct=${r.content_type} | pages=${r.display_pages}`);
  });

  db.close();
} catch (err) {
  console.error('Error auditing unified_content tags:', err);
  process.exit(1);
}