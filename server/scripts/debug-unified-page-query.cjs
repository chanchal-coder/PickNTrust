const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

function queryForPage(page, limit = 10) {
  const isHome = ['home', 'main', 'index'].includes(String(page || '').toLowerCase());
  let query = `SELECT id, title, category, display_pages, page_type, created_at FROM unified_content WHERE 1=1`;
  const params = { page, limit };

  if (isHome) {
    query += ` AND (\n      LOWER(display_pages) LIKE '%"' || LOWER(:page) || '"%' OR\n      LOWER(display_pages) = LOWER(:page) OR\n      REPLACE(LOWER(display_pages), ' ', '-') LIKE '%' || LOWER(:page) || '%' OR\n      LOWER(page_type) = LOWER(:page) OR\n      REPLACE(LOWER(page_type), ' ', '-') = LOWER(:page)\n    )`;
  } else {
    query += ` AND (\n      LOWER(display_pages) LIKE '%"' || LOWER(:page) || '"%' OR\n      LOWER(display_pages) = LOWER(:page) OR\n      REPLACE(LOWER(display_pages), ' ', '-') LIKE '%' || LOWER(:page) || '%' OR\n      LOWER(page_type) = LOWER(:page) OR\n      REPLACE(LOWER(page_type), ' ', '-') = LOWER(:page) OR\n      ((display_pages IS NULL OR display_pages = '') AND (:page = 'prime-picks' OR :page = 'global-picks'))\n    )`;
  }

  query += ` ORDER BY created_at DESC LIMIT :limit`;

  const rows = db.prepare(query).all(params);
  return rows;
}

const testPages = ['home', 'top-picks', 'prime-picks', 'global-picks', 'apps', 'services', 'trending'];
for (const p of testPages) {
  const rows = queryForPage(p, 5);
  console.log(`Page ${p} => ${rows.length} rows`);
  for (const r of rows) {
    console.log(`  • id=${r.id} title=${r.title || ''} category=${r.category || ''} page_type=${r.page_type || ''} display_pages=${r.display_pages}`);
  }
}