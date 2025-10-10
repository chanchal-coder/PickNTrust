const Database = require('better-sqlite3');

function run() {
  const db = new Database('database.sqlite');
  const page = 'prime-picks';
  const query = `
    SELECT * FROM unified_content 
    WHERE (
      status = 'active' OR status = 'published' OR status IS NULL
    )
    AND (
      visibility = 'public' OR visibility IS NULL
    )
    AND (
      processing_status != 'archived' OR processing_status IS NULL
    )
    AND (
      JSON_EXTRACT(display_pages, '$') LIKE '%' || ? || '%'
      OR display_pages LIKE '%' || ? || '%'
      OR display_pages = ?
      OR page_type = ?
      OR (display_pages IS NULL AND ? = 'prime-picks')
      OR (display_pages = '' AND ? = 'prime-picks')
    )
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const params = [page, page, page, page, page, page, 50, 0];
  const rows = db.prepare(query).all(...params);
  console.log('Count:', rows.length);
  console.log(rows.map(r => ({ id: r.id, title: r.title, display_pages: r.display_pages, created_at: r.created_at })));
  db.close();
}

run();