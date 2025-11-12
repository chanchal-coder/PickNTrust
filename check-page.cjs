const Database = require('better-sqlite3');
const path = require('path');

function getArg(name, defVal = null) {
  const pref = `--${name}=`;
  const found = process.argv.find(a => a.startsWith(pref));
  if (!found) return defVal;
  return found.slice(pref.length);
}

const page = getArg('page', 'prime-picks');
const category = getArg('category', null);
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

const cols = db.prepare('PRAGMA table_info(unified_content)').all().map(c => c.name);
const has = (n) => cols.includes(n);

let filters = [];
if (has('status')) {
  filters.push("(status IN ('active','published','ready','processed','completed') OR status IS NULL)");
}
if (has('visibility')) {
  filters.push("(visibility IN ('public','visible') OR visibility IS NULL)");
}
if (has('processing_status')) {
  filters.push("(processing_status != 'archived' OR processing_status IS NULL)");
}

if (category) {
  filters.push('(LOWER(category) = LOWER(@category))');
}

const where = filters.length ? ` AND ${filters.join(' AND ')}` : '';

const pageMatch = `(
  display_pages LIKE '%' || @page || '%' OR
  display_pages = @page OR
  page_type = @page OR
  REPLACE(LOWER(display_pages), ' ', '-') LIKE '%' || LOWER(@page) || '%' OR
  REPLACE(LOWER(page_type), ' ', '-') = LOWER(@page)
)`;

const countQuery = `SELECT COUNT(*) as count FROM unified_content WHERE 1=1 ${where} AND ${pageMatch}`;
const params = { page };
if (category) params.category = category;

try {
  const count = db.prepare(countQuery).get(params);
  console.log(`Page: ${page}`);
  if (category) console.log(`Category: ${category}`);
  console.log('Matching unified_content rows:', count.count);

  const sampleQuery = `
    SELECT id, title, category, is_featured, display_pages, page_type, status, visibility, processing_status, created_at
    FROM unified_content
    WHERE ${pageMatch} ${where}
    ORDER BY created_at DESC, id DESC
    LIMIT 10
  `;
  const rows = db.prepare(sampleQuery).all(params);
  console.log('\nSample rows:');
  for (const r of rows) {
    console.log({
      id: r.id,
      title: r.title,
      category: r.category,
      page_type: r.page_type,
      display_pages: r.display_pages,
      status: r.status,
      visibility: r.visibility,
      processing_status: r.processing_status,
    });
  }
} catch (err) {
  console.error('Error querying unified_content:', err.message);
} finally {
  db.close();
}