const Database = require('better-sqlite3');

try {
  const db = new Database('/var/www/pickntrust/database.sqlite');

  // Base filters aligned with server
  const base = `
    (status IN ('active','published','ready','processed','completed') OR status IS NULL)
    AND (visibility IN ('public','visible') OR visibility IS NULL)
    AND (processing_status != 'archived' OR processing_status IS NULL)
  `;

  const total = db.prepare(`SELECT COUNT(*) AS c FROM unified_content`).get().c;
  const featured = db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE ${base} AND is_featured = 1`).get().c;
  const topPages = db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE ${base} AND (display_pages LIKE '%top-picks%' OR page_type = 'top-picks')`).get().c;
  const services = db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE ${base} AND (is_service = 1 OR display_pages LIKE '%services%' OR page_type = 'services')`).get().c;
  const apps = db.prepare(`SELECT COUNT(*) AS c FROM unified_content WHERE ${base} AND (is_ai_app = 1 OR display_pages LIKE '%apps%' OR display_pages LIKE '%apps-ai-apps%' OR page_type IN ('apps','apps-ai-apps'))`).get().c;

  console.log(JSON.stringify({ total, featured, topPages, services, apps }));
  db.close();
} catch (e) {
  console.error('COUNTS_ERROR:', e && e.message ? e.message : e);
}