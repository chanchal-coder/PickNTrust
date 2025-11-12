/* Ensure production SQLite DB has correct banners and widgets schema */
const Database = require('better-sqlite3');

function openDb() {
  const dbPath = process.env.DB_PATH || '/var/www/pickntrust/database.sqlite';
  const db = new Database(dbPath);
  try { db.pragma('journal_mode = WAL'); } catch {}
  console.log('Opened DB at', dbPath);
  return db;
}

function getColumns(db, table) {
  try {
    return db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  } catch (e) {
    return [];
  }
}

function ensureBanners(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subtitle TEXT,
      imageUrl TEXT,
      linkUrl TEXT,
      buttonText TEXT,
      page TEXT,
      display_order INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      icon TEXT,
      iconType TEXT,
      iconPosition TEXT,
      useGradient INTEGER DEFAULT 0,
      backgroundGradient TEXT,
      backgroundOpacity INTEGER DEFAULT 100,
      imageDisplayType TEXT,
      unsplashQuery TEXT,
      showHomeLink INTEGER DEFAULT 1,
      homeLinkText TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cols = getColumns(db, 'banners');
  const addCol = (name, type, defaultExpr) => {
    if (!cols.includes(name)) {
      const def = defaultExpr ? ` DEFAULT ${defaultExpr}` : '';
      db.exec(`ALTER TABLE banners ADD COLUMN ${name} ${type}${def}`);
      console.log(`Added column banners.${name}`);
    }
  };

  addCol('title', 'TEXT');
  addCol('subtitle', 'TEXT');
  addCol('imageUrl', 'TEXT');
  addCol('linkUrl', 'TEXT');
  addCol('buttonText', 'TEXT');
  addCol('page', 'TEXT');
  addCol('display_order', 'INTEGER', 0);
  addCol('isActive', 'INTEGER', 1);
  addCol('icon', 'TEXT');
  addCol('iconType', 'TEXT');
  addCol('iconPosition', 'TEXT');
  addCol('useGradient', 'INTEGER', 0);
  addCol('backgroundGradient', 'TEXT');
  addCol('backgroundOpacity', 'INTEGER', 100);
  addCol('imageDisplayType', 'TEXT');
  addCol('unsplashQuery', 'TEXT');
  addCol('showHomeLink', 'INTEGER', 1);
  addCol('homeLinkText', 'TEXT');
  addCol('created_at', 'DATETIME');
  addCol('updated_at', 'DATETIME');

  // Seed a minimal home banner if table is empty to avoid 500/empty UI
  const count = db.prepare('SELECT COUNT(*) as c FROM banners').get().c;
  if (!count) {
    db.prepare(`
      INSERT INTO banners (
        title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
        icon, iconType, iconPosition, useGradient, backgroundGradient, backgroundOpacity,
        imageDisplayType, unsplashQuery, showHomeLink, homeLinkText
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 0, '', 100, 'image', '', 1, 'Back to Home')
    `).run(
      'Welcome to PickNTrust',
      'Curated picks and deals',
      '/uploads/default-banner.jpg',
      '/',
      'Explore',
      'home',
      1,
      '', 'none', 'left'
    );
    console.log('Seeded a default home banner');
  }
}

function ensureWidgets(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      body TEXT,
      code TEXT NOT NULL,
      target_page TEXT NOT NULL,
      type TEXT,
      position TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      max_width TEXT,
      custom_css TEXT,
      show_on_mobile INTEGER DEFAULT 1,
      show_on_desktop INTEGER DEFAULT 1,
      external_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cols = getColumns(db, 'widgets');
  const colsInfo = db.prepare('PRAGMA table_info(widgets)').all();
  const addCol = (name, type, defaultExpr) => {
    if (!cols.includes(name)) {
      const def = defaultExpr ? ` DEFAULT ${defaultExpr}` : '';
      db.exec(`ALTER TABLE widgets ADD COLUMN ${name} ${type}${def}`);
      console.log(`Added column widgets.${name}`);
    }
  };

  addCol('name', 'TEXT');
  addCol('description', 'TEXT');
  addCol('body', 'TEXT');
  addCol('code', 'TEXT');
  addCol('target_page', 'TEXT');
  addCol('type', 'TEXT');
  addCol('position', 'TEXT');
  addCol('is_active', 'INTEGER', 1);
  addCol('display_order', 'INTEGER', 0);
  addCol('max_width', 'TEXT');
  addCol('custom_css', 'TEXT');
  addCol('show_on_mobile', 'INTEGER', 1);
  addCol('show_on_desktop', 'INTEGER', 1);
  addCol('external_link', 'TEXT');
  addCol('created_at', 'DATETIME');

  // Seed a minimal widget for home header-top if none exist
  const total = db.prepare('SELECT COUNT(*) as c FROM widgets').get().c;
  if (!total) {
    const insertCols = [
      'name','description','body','code','target_page','position','is_active','display_order','max_width','custom_css','show_on_mobile','show_on_desktop','external_link'
    ];
    const typeInfo = colsInfo.find(c => c.name === 'type');
    const mustSetType = !!typeInfo && typeInfo.notnull === 1 && (typeInfo.dflt_value === null || typeInfo.dflt_value === undefined);
    const values = [
      'Hero Promo',
      'Top header promo widget',
      null,
      '<div class="hero">Welcome to PickNTrust</div>',
      'home',
      'header-top',
      1,
      1,
      null,
      null,
      1,
      1,
      null
    ];
    if (mustSetType) {
      insertCols.unshift('type');
      values.unshift('html');
    }
    const placeholders = insertCols.map(() => '?').join(', ');
    db.prepare(`INSERT INTO widgets (${insertCols.join(', ')}) VALUES (${placeholders})`).run(...values);
    console.log('Seeded a default home header-top widget');
  }
}

function main() {
  const db = openDb();
  try {
    ensureBanners(db);
    ensureWidgets(db);
    console.log('Schema fix complete');
  } catch (e) {
    console.error('Schema fix failed:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try { db.close(); } catch {}
  }
}

try { main(); } catch (e) {
  console.error('RUN_ERROR:', e && e.message ? e.message : e);
  process.exit(2);
}