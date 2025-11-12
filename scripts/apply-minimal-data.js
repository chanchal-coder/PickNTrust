// Seeds minimal data into the production SQLite DB to avoid 500/404s
// Uses better-sqlite3 and targets the canonical server DB path
const Database = require('better-sqlite3');

function ensureTables(db) {
  // Widgets: minimal schema with page, position, items JSON
  db.exec(`
    CREATE TABLE IF NOT EXISTS widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      position TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Banners: minimal schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      image_url TEXT,
      link_url TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Testimonials: minimal schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT,
      quote TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Meta tags: minimal schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      title TEXT,
      description TEXT,
      keywords TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Placeholders: minimal schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS placeholders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData(db) {
  const hasWidgets = db.prepare('SELECT COUNT(1) AS c FROM widgets WHERE page = ? AND position = ?').get('home', 'content-top').c;
  if (!hasWidgets) {
    db.prepare('INSERT INTO widgets (page, position, items_json) VALUES (?, ?, ?)')
      .run('home', 'content-top', JSON.stringify([]));
  }

  const hasBanners = db.prepare('SELECT COUNT(1) AS c FROM banners WHERE page = ? AND active = 1').get('home').c;
  if (!hasBanners) {
    db.prepare('INSERT INTO banners (page, image_url, link_url, active) VALUES (?, ?, ?, 1)')
      .run('home', null, null);
  }

  const hasTestimonials = db.prepare('SELECT COUNT(1) AS c FROM testimonials WHERE active = 1').get().c;
  if (!hasTestimonials) {
    db.prepare('INSERT INTO testimonials (author, quote, active) VALUES (?, ?, 1)')
      .run('System', 'Welcome to PickNTrust', 1);
  }

  const hasMeta = db.prepare('SELECT COUNT(1) AS c FROM meta_tags WHERE page = ?').get('home').c;
  if (!hasMeta) {
    db.prepare('INSERT INTO meta_tags (page, title, description, keywords) VALUES (?, ?, ?, ?)')
      .run('home', 'PickNTrust', 'Shopping categories, announcements and blogs', 'shopping,categories,blogs');
  }

  const hasPlaceholder = db.prepare('SELECT COUNT(1) AS c FROM placeholders WHERE key = ?').get('homepage_message').c;
  if (!hasPlaceholder) {
    db.prepare('INSERT INTO placeholders (key, value) VALUES (?, ?)')
      .run('homepage_message', 'Site is restoring. Content will appear shortly.');
  }
}

function main() {
  const dbPath = '/var/www/pickntrust/database.sqlite';
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  ensureTables(db);
  seedData(db);
  db.close();
  console.log('Minimal data seeded into', dbPath);
}

try {
  main();
} catch (e) {
  console.error('SEED_ERROR:', e && e.message ? e.message : e);
  process.exit(1);
}