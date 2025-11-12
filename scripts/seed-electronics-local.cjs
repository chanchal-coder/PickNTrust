/* Seed Electronics & Gadgets parent and canonical subcategories for local SQLite */
const Database = require('better-sqlite3');
const path = require('path');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function run() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const parentName = 'Electronics & Gadgets';
  const parentSlug = slugify(parentName);

  db.exec('BEGIN');
  const ensureParent = db.prepare(
    `INSERT INTO categories (name, slug, icon, color, description, parent_id, is_for_products, is_for_services, is_for_ai_apps, is_active, display_order)
     SELECT ?,?,?,?,?,NULL,1,0,0,1,1
     WHERE NOT EXISTS (SELECT 1 FROM categories WHERE LOWER(name)=LOWER(?))`
  );
  ensureParent.run(parentName, parentSlug, 'fa-solid fa-microchip', '#3b82f6', 'Electronics and tech devices', parentName);

  const parentRow = db.prepare('SELECT id, name FROM categories WHERE LOWER(name)=LOWER(?)').get(parentName);
  if (!parentRow) {
    db.exec('ROLLBACK');
    throw new Error('Failed to create/find Electronics & Gadgets parent');
  }
  const parentId = parentRow.id;

  const children = [
    ['Smartphones', 1],
    ['Laptops & Computers', 2],
    ['Audio & Wearables', 3],
    ['Televisions', 4],
    ['Cameras', 5],
    ['Computer Accessories', 6],
    ['Gaming Consoles', 7],
    ['Smart Home', 8],
    ['Storage & Memory', 9],
    ['Networking & Routers', 10]
  ];

  const up = db.prepare(
    'UPDATE categories SET parent_id=?, is_for_products=1, is_for_services=0, is_for_ai_apps=0, is_active=1, display_order=? WHERE LOWER(name)=LOWER(?)'
  );
  const ins = db.prepare(
    'INSERT INTO categories (name, slug, parent_id, is_for_products, is_for_services, is_for_ai_apps, is_active, display_order) VALUES (?,?,?,?,?,?,?,?)'
  );

  for (const [name, order] of children) {
    const slug = slugify(name);
    const r = up.run(parentId, order, name);
    if (r.changes === 0) {
      ins.run(name, slug, parentId, 1, 0, 0, 1, order);
    }
  }

  db.exec('COMMIT');

  const rows = db
    .prepare('SELECT id, name, parent_id, display_order FROM categories WHERE parent_id=? ORDER BY display_order, name')
    .all(parentId);
  console.log('Seeded Electronics & Gadgets children count:', rows.length);
  console.log(rows);
}

run();