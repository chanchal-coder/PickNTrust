/* Seed minimal home/content-top widget into the pm2 DB path */
const Database = require('better-sqlite3');

function seed() {
  const dbPath = process.env.DB_PATH || '/home/ec2-user/pickntrust/database.sqlite';
  const db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
  } catch {}

  let cols = db.prepare("PRAGMA table_info(widgets)").all().map(c => c.name);
  const addIfMissing = (name, sql) => {
    try { if (!cols.includes(name)) { db.exec(sql); } } catch {}
  };
  // Ensure expected columns exist (safe idempotent)
  addIfMissing('description', "ALTER TABLE widgets ADD COLUMN description TEXT");
  addIfMissing('body', "ALTER TABLE widgets ADD COLUMN body TEXT");
  addIfMissing('code', "ALTER TABLE widgets ADD COLUMN code TEXT");
  addIfMissing('max_width', "ALTER TABLE widgets ADD COLUMN max_width TEXT");
  addIfMissing('custom_css', "ALTER TABLE widgets ADD COLUMN custom_css TEXT");
  addIfMissing('show_on_mobile', "ALTER TABLE widgets ADD COLUMN show_on_mobile INTEGER DEFAULT 1");
  addIfMissing('show_on_desktop', "ALTER TABLE widgets ADD COLUMN show_on_desktop INTEGER DEFAULT 1");
  addIfMissing('external_link', "ALTER TABLE widgets ADD COLUMN external_link TEXT");
  cols = db.prepare("PRAGMA table_info(widgets)").all().map(c => c.name);

  const existing = db.prepare("SELECT COUNT(*) as c FROM widgets WHERE target_page = ? AND position = ?").get('home','content-top').c;
  if (!existing) {
    db.prepare(
      "INSERT INTO widgets (name, description, body, code, target_page, position, is_active, display_order, max_width, custom_css, show_on_mobile, show_on_desktop, external_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).run(
      'Homepage Top Content', null, null, 'div.home-top', 'home', 'content-top', 1, 1, null, null, 1, 1, null
    );
    console.log('Inserted minimal home/content-top widget.');
  } else {
    console.log('Home/content-top widget already present.');
  }
}

try {
  seed();
  console.log('Done.');
} catch (e) {
  console.error('SEED_FAIL:', e && e.message ? e.message : e);
  process.exit(1);
}