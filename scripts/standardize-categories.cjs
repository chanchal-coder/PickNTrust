// Standardize category names and parent hierarchy to canonical structure
// - Ensures canonical parent categories exist
// - Fixes common typos and synonyms (e.g., "jewellery" → "Jewelry & Watches")
// - Unifies "Home" variants under "Home & Living" with correct children
// - Deduplicates categories by name (case-insensitive), preferring canonical rows

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function resolveDbPath() {
  // Prefer server/db.ts default (./database.sqlite)
  const candidates = [
    path.join(__dirname, '..', 'database.sqlite'),
    path.join(__dirname, '..', 'server', 'database.sqlite'),
  ].filter(p => fs.existsSync(p));
  if (candidates.length === 0) {
    throw new Error('Database file not found in expected locations.');
  }
  return candidates[0];
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 64);
}

function getSchema(db) {
  const info = db.prepare('PRAGMA table_info(categories)').all();
  const cols = new Map(info.map(c => [c.name, c]));
  return {
    has: name => cols.has(name),
  };
}

function ensureUniqueNameIndex(db) {
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_nocase ON categories(name COLLATE NOCASE);`);
  } catch {}
}

function ensureParent(db, schema, name, flags, icon = 'fas fa-tag', color = '#3B82F6', order = 0) {
  const findAny = db.prepare('SELECT id, name, parent_id FROM categories WHERE LOWER(name) = LOWER(?)').get(name);
  if (findAny) {
    // Promote existing row to be a parent if needed and set flags
    const sets = ['parent_id = NULL'];
    const vals = [];
    if (schema.has('is_for_products')) { sets.push('is_for_products = ?'); vals.push(flags.products ? 1 : 0); }
    if (schema.has('is_for_services')) { sets.push('is_for_services = ?'); vals.push(flags.services ? 1 : 0); }
    if (schema.has('is_for_ai_apps')) { sets.push('is_for_ai_apps = ?'); vals.push(flags.apps ? 1 : 0); }
    if (schema.has('icon')) { sets.push('icon = ?'); vals.push(icon); }
    if (schema.has('color')) { sets.push('color = ?'); vals.push(color); }
    if (schema.has('display_order')) { sets.push('display_order = ?'); vals.push(order); }
    db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...vals, findAny.id);
    return findAny.id;
  }

  const cols = ['name', 'parent_id'];
  const vals = [name, null];
  if (schema.has('slug')) { cols.push('slug'); vals.push(slugify(name)); }
  if (schema.has('icon')) { cols.push('icon'); vals.push(icon); }
  if (schema.has('color')) { cols.push('color'); vals.push(color); }
  if (schema.has('description')) { cols.push('description'); vals.push(''); }
  if (schema.has('is_for_products')) { cols.push('is_for_products'); vals.push(flags.products ? 1 : 0); }
  if (schema.has('is_for_services')) { cols.push('is_for_services'); vals.push(flags.services ? 1 : 0); }
  if (schema.has('is_for_ai_apps')) { cols.push('is_for_ai_apps'); vals.push(flags.apps ? 1 : 0); }
  if (schema.has('display_order')) { cols.push('display_order'); vals.push(order); }

  const sql = `INSERT INTO categories (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
  const res = db.prepare(sql).run(...vals);
  return res.lastInsertRowid;
}

function setChild(db, schema, row, newName, parentId) {
  const sets = ['name = ?', 'parent_id = ?'];
  const vals = [newName, parentId];
  if (schema.has('slug')) { sets.push('slug = ?'); vals.push(slugify(newName)); }
  const sql = `UPDATE categories SET ${sets.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...vals, row.id);
}

function deleteRow(db, id) {
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

function main() {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  const schema = getSchema(db);
  ensureUniqueNameIndex(db);

  // Canonical parents
  const parents = [
    { name: 'Fashion & Accessories', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-tshirt', color: '#ec4899', order: 10 },
    { name: 'Home & Living', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-home', color: '#10b981', order: 20 },
    { name: 'Electronics & Gadgets', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-microchip', color: '#3b82f6', order: 30 },
    { name: 'Health & Beauty', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-heart', color: '#f59e0b', order: 40 },
    { name: 'Sports & Fitness', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-dumbbell', color: '#2563eb', order: 50 },
    { name: 'Baby & Kids', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-baby', color: '#06b6d4', order: 60 },
    { name: 'Automotive', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-car', color: '#4b5563', order: 70 },
    { name: 'Books & Education', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-book', color: '#8b5cf6', order: 80 },
    { name: 'Pet Supplies', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-paw', color: '#22c55e', order: 90 },
    { name: 'Office & Productivity', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-briefcase', color: '#0ea5e9', order: 100 },
    { name: 'Travel', flags: { products: 1, services: 0, apps: 0 }, icon: 'fas fa-suitcase-rolling', color: '#ef4444', order: 110 },
    { name: 'Services', flags: { products: 0, services: 1, apps: 0 }, icon: 'fas fa-concierge-bell', color: '#64748b', order: 120 },
    { name: 'Apps & AI Apps', flags: { products: 0, services: 0, apps: 1 }, icon: 'fas fa-robot', color: '#14b8a6', order: 130 },
  ];

  const parentIds = {};
  db.exec('BEGIN');
  try {
    for (const p of parents) {
      parentIds[p.name] = ensureParent(db, schema, p.name, p.flags, p.icon, p.color, p.order);
    }

    // Corrections mapping
    const corrections = [
      // Jewelry synonyms and typos → child under Fashion
      { match: [/^jewell?ery$/i, /^jewelry$/i, /^jewelries$/i], newName: 'Jewelry & Watches', parent: 'Fashion & Accessories' },
      { match: [/^watches?$/i], newName: 'Jewelry & Watches', parent: 'Fashion & Accessories' },

      // Home variants unified under Home & Living
      { match: [/^home$/i, /^home & living$/i], newName: 'Home & Living', parent: null },
      { match: [/^home & kitchen$/i, /^home and kitchen$/i, /^kitech and dining$/i], newName: 'Kitchen & Dining', parent: 'Home & Living' },
      { match: [/^home & garden$/i, /^home and garden$/i], newName: 'Garden & Outdoor', parent: 'Home & Living' },
      { match: [/^home decor$/i, /^decor$/i], newName: 'Home Decor', parent: 'Home & Living' },
    ];

    const rows = db.prepare('SELECT id, name, parent_id FROM categories').all();
    const byName = (name) => db.prepare('SELECT id, name, parent_id FROM categories WHERE name = ? COLLATE NOCASE').get(name);

    for (const row of rows) {
      for (const corr of corrections) {
        if (corr.match.some(rx => rx.test(row.name))) {
          const targetParentId = corr.parent ? parentIds[corr.parent] : null;
          const existing = byName(corr.newName);
          if (existing && existing.id !== row.id) {
            // If existing canonical row exists, delete current duplicate and prefer canonical
            deleteRow(db, row.id);
          } else {
            // Rename and set parent
            setChild(db, schema, row, corr.newName, targetParentId);
          }
          break;
        }
      }
    }

    // Ensure Kitchen & Dining and Garden & Outdoor exist as children under Home & Living if referenced
    const ensureChild = (childName, parentName) => {
      const existing = byName(childName);
      if (existing) {
        if (existing.parent_id !== parentIds[parentName]) {
          setChild(db, schema, existing, childName, parentIds[parentName]);
        }
        return existing.id;
      }
      const cols = ['name', 'parent_id'];
      const vals = [childName, parentIds[parentName]];
      if (schema.has('slug')) { cols.push('slug'); vals.push(slugify(childName)); }
      const sql = `INSERT INTO categories (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
      const res = db.prepare(sql).run(...vals);
      return res.lastInsertRowid;
    };

    ensureChild('Kitchen & Dining', 'Home & Living');
    ensureChild('Garden & Outdoor', 'Home & Living');
    ensureChild('Home Decor', 'Home & Living');

    db.exec('COMMIT');
    console.log('✅ Categories standardized successfully.');
  } catch (err) {
    console.error('❌ Standardization failed:', err.message);
    try { db.exec('ROLLBACK'); } catch {}
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();