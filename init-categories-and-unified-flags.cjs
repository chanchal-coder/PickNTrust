// Initialize missing columns on unified_content and ensure categories table
const Database = require('better-sqlite3');

const DB_PATH = './database.sqlite';
const db = new Database(DB_PATH);

function tableHasColumn(tableName, columnName) {
  const stmt = db.prepare(`PRAGMA table_info(${tableName})`);
  const cols = stmt.all();
  return cols.some(c => c.name === columnName);
}

function addColumnIfMissing(tableName, columnDef) {
  const [columnName] = columnDef.split(/\s+/);
  if (!tableHasColumn(tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
    console.log(`✅ Added column ${columnName} to ${tableName}`);
  } else {
    console.log(`✔︎ Column ${columnName} already exists on ${tableName}`);
  }
}

function ensureUnifiedContentColumns() {
  // If table doesn't exist, create with full schema
  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='unified_content'"
  ).get();

  if (!tableExists) {
    console.log('ℹ️ unified_content does not exist — creating it with full schema');
    db.exec(`
      CREATE TABLE unified_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL,
        original_price REAL,
        image_url TEXT,
        affiliate_url TEXT,
        affiliate_urls TEXT,
        content_type TEXT NOT NULL,
        page_type TEXT,
        category TEXT,
        subcategory TEXT,
        tags TEXT,
        brand TEXT,
        source_platform TEXT,
        media_urls TEXT,
        is_active INTEGER DEFAULT 1,
        is_featured INTEGER DEFAULT 0,
        is_service INTEGER DEFAULT 0,
        is_ai_app INTEGER DEFAULT 0,
        display_pages TEXT DEFAULT '["home"]',
        status TEXT DEFAULT 'active',
        visibility TEXT DEFAULT 'public',
        processing_status TEXT DEFAULT 'completed',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    return;
  }

  // Ensure required columns used by routes exist
  addColumnIfMissing('unified_content', "is_service INTEGER DEFAULT 0");
  addColumnIfMissing('unified_content', "is_ai_app INTEGER DEFAULT 0");
  addColumnIfMissing('unified_content', "status TEXT DEFAULT 'active'");
  addColumnIfMissing('unified_content', "visibility TEXT DEFAULT 'public'");
  addColumnIfMissing('unified_content', "processing_status TEXT DEFAULT 'completed'");
  addColumnIfMissing('unified_content', "created_at TEXT DEFAULT (datetime('now'))");
}

function ensureCategoriesTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);
  // Ensure standard columns exist if table was created earlier with minimal schema
  addColumnIfMissing('categories', "description TEXT");
  addColumnIfMissing('categories', "icon TEXT");
  addColumnIfMissing('categories', "color TEXT");
  addColumnIfMissing('categories', "parent_id INTEGER");
  addColumnIfMissing('categories', "is_for_products INTEGER DEFAULT 1");
  addColumnIfMissing('categories', "is_for_services INTEGER DEFAULT 0");
  addColumnIfMissing('categories', "is_for_ai_apps INTEGER DEFAULT 0");
  addColumnIfMissing('categories', "is_active INTEGER DEFAULT 1");
  addColumnIfMissing('categories', "display_order INTEGER DEFAULT 0");
}

function seedInitialCategories() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO categories (name, description, display_order, is_for_products, is_for_services, is_for_ai_apps)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run('Home Services', 'Local and on-demand services for home', 1, 0, 1, 0);
  insert.run('Finance', 'Money, budgeting, and financial tools', 2, 1, 0, 1);
}

function normalizeExistingRows() {
  // Set service/app flags based on content_type
  db.exec(`UPDATE unified_content SET is_service = 1 WHERE content_type = 'service' AND (is_service IS NULL OR is_service = 0);`);
  db.exec(`UPDATE unified_content SET is_ai_app = 1 WHERE content_type = 'app' AND (is_ai_app IS NULL OR is_ai_app = 0);`);

  // Default visibility/status/processing values used by category browse queries
  db.exec(`UPDATE unified_content SET status = COALESCE(status, 'active');`);
  db.exec(`UPDATE unified_content SET visibility = COALESCE(visibility, 'public');`);
  db.exec(`UPDATE unified_content SET processing_status = COALESCE(processing_status, 'completed');`);
}

db.transaction(() => {
  ensureUnifiedContentColumns();
  ensureCategoriesTable();
  seedInitialCategories();
  normalizeExistingRows();
})();

console.log('✅ Schema initialized: unified_content flags ensured and categories table ready.');