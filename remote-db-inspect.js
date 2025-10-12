const Database = require('better-sqlite3');

try {
  const db = new Database('/var/www/pickntrust/database.sqlite');
  const schema = db.prepare('PRAGMA table_info(unified_content)').all();
  console.log('SCHEMA_COLUMNS:', schema.map(c => c.name));
  const count = db.prepare('SELECT COUNT(*) AS c FROM unified_content').get();
  console.log('ROW_COUNT:', count.c);
  const sample = db.prepare(`
    SELECT id, title, status, visibility, processing_status,
           is_featured, isFeatured, is_service, is_ai_app,
           page_type, display_pages
    FROM unified_content
    ORDER BY created_at DESC
    LIMIT 10
  `).all();
  console.log('SAMPLE_ROWS:', sample);
  db.close();
} catch (e) {
  console.error('DB_INSPECT_ERROR:', e && e.message ? e.message : e);
}