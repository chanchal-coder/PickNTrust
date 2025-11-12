const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbPath);
  const q = `
    SELECT * FROM unified_content
    WHERE (
      (
        display_pages LIKE '%apps%'
        OR display_pages LIKE '%apps-ai-apps%'
        OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps%'
        OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps-ai-apps%'
        OR LOWER(page_type) IN ('apps','apps-ai-apps')
      )
      OR (
        is_ai_app = 1
        OR CAST(is_ai_app AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y','on','ON')
      )
    )
    ORDER BY created_at DESC
  `;
  const rows = db.prepare(q).all();
  console.log('Rows:', rows.length);
  rows.slice(0, 10).forEach(r => {
    console.log({ id: r.id, title: r.title, display_pages: r.display_pages, is_ai_app: r.is_ai_app, page_type: r.page_type });
  });
  db.close();
} catch (e) {
  console.error('Error running apps query:', e);
}