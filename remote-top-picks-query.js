const Database = require('better-sqlite3');

try {
  const db = new Database('/var/www/pickntrust/database.sqlite');
  const limit = 5;
  const offset = 0;
  const query = `
    SELECT * FROM unified_content
    WHERE (
      status IN ('active','published','ready','processed','completed') OR status IS NULL
    )
    AND (
      visibility IN ('public','visible') OR visibility IS NULL
    )
    AND (
      processing_status != 'archived' OR processing_status IS NULL
    )
    AND (
      is_featured = 1 OR
      display_pages LIKE '%top-picks%' OR
      page_type = 'top-picks'
    )
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `;
  const rows = db.prepare(query).all(limit, offset);
  console.log('ROW_COUNT:', rows.length);
  console.log('FIRST_IDS:', rows.map(r => r.id));
  db.close();
} catch (e) {
  console.error('TOP_PICKS_QUERY_ERROR:', e && e.message ? e.message : e);
}