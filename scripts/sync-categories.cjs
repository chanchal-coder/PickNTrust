const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const serverDbPath = path.join(__dirname, '..', 'server', 'database.sqlite');
const rootDbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🔄 Syncing categories from server DB to root DB');
console.log('Server DB:', serverDbPath);
console.log('Root DB:', rootDbPath);

if (!fs.existsSync(serverDbPath)) {
  console.error('❌ Server database not found at', serverDbPath);
  process.exit(1);
}
if (!fs.existsSync(rootDbPath)) {
  console.error('❌ Root database not found at', rootDbPath);
  process.exit(1);
}

const serverDb = new Database(serverDbPath);
const rootDb = new Database(rootDbPath);

function tableExists(db, name) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  return !!row;
}

try {
  // Ensure categories table exists in both DBs
  if (!tableExists(serverDb, 'categories')) {
    console.error('❌ Categories table missing in server DB');
    process.exit(1);
  }
  if (!tableExists(rootDb, 'categories')) {
    console.log('ℹ️ Categories table missing in root DB, creating…');
    rootDb.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '📦',
        color TEXT DEFAULT '#666666',
        description TEXT DEFAULT '',
        parent_id INTEGER,
        is_for_products INTEGER DEFAULT 0,
        is_for_services INTEGER DEFAULT 0,
        is_for_ai_apps INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0
      )
    `);
  }

  const serverCats = serverDb.prepare(`
    SELECT id, name, icon, color, description, parent_id,
           is_for_products, is_for_services, is_for_ai_apps,
           is_active, display_order
    FROM categories
    ORDER BY id ASC
  `).all();

  console.log(`Found ${serverCats.length} categories in server DB.`);

  // Replace root categories with server categories to unify
  rootDb.exec('BEGIN');
  try {
    rootDb.exec('DELETE FROM categories');
    const insert = rootDb.prepare(`
      INSERT INTO categories (
        id, name, icon, color, description, parent_id,
        is_for_products, is_for_services, is_for_ai_apps,
        is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    let inserted = 0;
    for (const c of serverCats) {
      insert.run(
        c.id,
        c.name,
        c.icon,
        c.color,
        c.description,
        c.parent_id,
        c.is_for_products,
        c.is_for_services,
        c.is_for_ai_apps,
        c.is_active,
        c.display_order
      );
      inserted++;
    }
    rootDb.exec('COMMIT');
    console.log(`✅ Inserted ${inserted} categories into root DB.`);
  } catch (err) {
    rootDb.exec('ROLLBACK');
    throw err;
  }

  // Verify a few entries
  const sample = rootDb.prepare('SELECT id, name, parent_id FROM categories ORDER BY id ASC LIMIT 10').all();
  console.log('Sample categories in root DB:', sample);

} catch (e) {
  console.error('❌ Sync error:', e.message);
  console.error(e);
  process.exit(1);
} finally {
  serverDb.close();
  rootDb.close();
}

console.log('✅ Categories sync complete.');