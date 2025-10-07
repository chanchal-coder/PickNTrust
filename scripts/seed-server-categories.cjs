/*
 * Seed canonical parent categories into server/database.sqlite so form endpoints return data.
 * Idempotent: creates table if missing and inserts parents only if absent.
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'database.sqlite');
const db = new Database(dbPath);

function ensureCategoriesTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
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

function insertParents() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO categories (name, parent_id, icon, color, description,
      is_for_products, is_for_services, is_for_ai_apps, is_active, display_order)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const products = [
    'Fashion',
    'Home & Living',
    'Electronics & Gadgets',
    'Beauty',
    'Sports & Fitness',
    'Books & Education',
    'Automotive',
  ];
  products.forEach((name, idx) => insert.run(name, '📦', '#3B82F6', '', 1, 0, 0, idx + 1));

  const services = [
    'Services',
    'Digital Services',
    'Marketing Services',
    'Home Services',
    'Health & Wellness Services',
  ];
  services.forEach((name, idx) => insert.run(name, '🛠️', '#10B981', '', 0, 1, 0, idx + 1));

  const aiapps = [
    'Apps & AI Apps',
    'AI Tools',
    'Productivity Apps',
    'Design Apps',
  ];
  aiapps.forEach((name, idx) => insert.run(name, '🤖', '#7C3AED', '', 0, 0, 1, idx + 1));
}

try {
  ensureCategoriesTable();
  insertParents();
  const topLevel = db.prepare('SELECT id, name, is_for_products, is_for_services, is_for_ai_apps FROM categories WHERE parent_id IS NULL ORDER BY display_order, name').all();
  console.log('✅ Seeded server/database.sqlite parent categories:', topLevel.map(c => c.name));
} catch (err) {
  console.error('❌ Error seeding server categories:', err.message);
  process.exitCode = 1;
} finally {
  db.close();
}