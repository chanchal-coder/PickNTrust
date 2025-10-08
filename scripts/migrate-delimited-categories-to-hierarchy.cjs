// Convert any "Parent > Child" category names into proper parent/child hierarchy
// - Creates missing parent rows with safe defaults based on current schema
// - Updates existing malformed rows to become children (name=Child, parent_id=Parent.id)
// - If a clean child already exists, removes the malformed "Parent > Child" row to avoid duplicates
// - Adapts to schema variations (some DBs require slug/icon/color/description)

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function resolveDbPath() {
  const candidates = [
    // Prefer root DB first (observed to contain categories table)
    path.join(__dirname, '..', 'database.sqlite'),
    path.join(__dirname, '..', 'server', 'database.sqlite'),
    path.join(__dirname, '..', 'sqlite.db'),
    // Fallbacks in CWD
    path.join(process.cwd(), 'database.sqlite'),
    path.join(process.cwd(), 'server', 'database.sqlite'),
    path.join(process.cwd(), 'sqlite.db'),
  ].filter(p => fs.existsSync(p));
  if (candidates.length === 0) {
    throw new Error('Database file not found in expected locations.');
  }
  // Pick the first that actually has a categories table
  for (const p of candidates) {
    try {
      const testDb = new Database(p);
      const exists = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
      testDb.close();
      if (exists) return p;
    } catch {
      // try next
    }
  }
  // Default to first existing file if none show categories (will error later, but we tried)
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

function getCategoriesSchema(db) {
  const info = db.prepare('PRAGMA table_info(categories)').all();
  const cols = new Map(info.map(c => [c.name, c]));
  return {
    info,
    has: name => cols.has(name),
    notNull: name => cols.has(name) ? !!cols.get(name).notnull : false,
  };
}

function ensureUniqueSlug(db, base) {
  const exists = db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(base);
  if (!exists) return base;
  let i = 2;
  while (true) {
    const candidate = `${base}-${i}`;
    const e = db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(candidate);
    if (!e) return candidate;
    i++;
  }
}

function ensureParent(db, schema, parentName, flags = { products: 1, services: 0, apps: 0 }) {
  const findParent = db.prepare('SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)').get(parentName);
  if (findParent) return findParent.id;

  const cols = ['name'];
  const vals = [parentName];

  if (schema.has('slug')) {
    cols.push('slug');
    vals.push(ensureUniqueSlug(db, slugify(parentName)));
  }
  if (schema.has('icon')) {
    cols.push('icon');
    vals.push('fas fa-tag');
  }
  if (schema.has('color')) {
    cols.push('color');
    vals.push('#3b82f6');
  }
  if (schema.has('description')) {
    cols.push('description');
    vals.push('');
  }
  if (schema.has('parent_id')) {
    cols.push('parent_id');
    vals.push(null);
  }
  if (schema.has('is_for_products')) { cols.push('is_for_products'); vals.push(flags.products ? 1 : 0); }
  if (schema.has('is_for_services')) { cols.push('is_for_services'); vals.push(flags.services ? 1 : 0); }
  if (schema.has('is_for_ai_apps')) { cols.push('is_for_ai_apps'); vals.push(flags.apps ? 1 : 0); }
  if (schema.has('display_order')) { cols.push('display_order'); vals.push(0); }

  const sql = `INSERT INTO categories (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
  const res = db.prepare(sql).run(...vals);
  return res.lastInsertRowid;
}

function updateRowToChild(db, schema, rowId, childName, parentId) {
  const sets = ['name = ?', 'parent_id = ?'];
  const vals = [childName, parentId];
  if (schema.has('slug')) {
    sets.push('slug = ?');
    vals.push(ensureUniqueSlug(db, slugify(childName)));
  }
  const sql = `UPDATE categories SET ${sets.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...vals, rowId);
}

function main() {
  const dbPath = resolveDbPath();
  console.log(`🔧 Migrating delimited categories in: ${dbPath}`);
  const db = new Database(dbPath);
  const schema = getCategoriesSchema(db);

  // Collect malformed category rows from categories table
  const badRows = db.prepare(`
    SELECT id, name FROM categories WHERE name LIKE '%>%' ORDER BY name
  `).all();

  if (badRows.length === 0) {
    console.log('✅ No delimited category names found. Nothing to migrate.');
    db.close();
    return;
  }

  console.log(`Found ${badRows.length} malformed category rows. Starting migration...`);

  try {
    db.exec('BEGIN');

    const findByName = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)');
    const deleteById = db.prepare('DELETE FROM categories WHERE id = ?');

    for (const row of badRows) {
      const original = row.name;
      const parts = original.split('>').map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) continue;
      const parentName = parts[0];
      const childName = parts.slice(1).join(' > '); // support deep chains, treat remainder as child label

      // Ensure parent exists (create if missing)
      const parentId = ensureParent(db, schema, parentName);

      // If a clean child already exists, drop the malformed row to avoid unique conflicts
      const existingChild = findByName.get(childName);
      if (existingChild && existingChild.id !== row.id) {
        console.log(`🗑️  Removing duplicate row '${original}' (child '${childName}' already exists)`);
        deleteById.run(row.id);
        continue;
      }

      // Otherwise, convert this row into the child under the ensured parent
      console.log(`🔁 Converting '${original}' → parent='${parentName}', child='${childName}'`);
      updateRowToChild(db, schema, row.id, childName, parentId);
    }

    db.exec('COMMIT');
    console.log('✅ Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    try { db.exec('ROLLBACK'); } catch {}
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();