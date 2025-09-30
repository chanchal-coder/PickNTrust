const path = require('path');
const Database = require('better-sqlite3');

function ensureVideoContentColumns(db) {
  const table = 'video_content';
  const existing = db.prepare(`PRAGMA table_info(${table})`).all();
  const cols = new Set(existing.map(c => c.name));

  const planned = [
    { name: 'pages', sql: "ALTER TABLE video_content ADD COLUMN pages TEXT DEFAULT '[]'" },
    { name: 'show_on_homepage', sql: "ALTER TABLE video_content ADD COLUMN show_on_homepage INTEGER DEFAULT 1" },
    { name: 'cta_text', sql: "ALTER TABLE video_content ADD COLUMN cta_text TEXT" },
    { name: 'cta_url', sql: "ALTER TABLE video_content ADD COLUMN cta_url TEXT" },
  ];

  let added = 0;
  for (const p of planned) {
    if (!cols.has(p.name)) {
      db.exec(p.sql);
      added++;
      console.log(`Added column: ${p.name}`);
    } else {
      console.log(`Column already exists: ${p.name}`);
    }
  }

  const after = db.prepare(`PRAGMA table_info(${table})`).all();
  console.log('Final video_content columns:', after.map(c => c.name));
  return added;
}

try {
  const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
  console.log('Using database:', dbPath);
  const db = new Database(dbPath);

  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='video_content'").get();
  if (!tableExists) {
    console.error('video_content table does not exist. Start the server once to initialize base schema.');
    process.exit(2);
  }

  const added = ensureVideoContentColumns(db);
  console.log(`Schema fix complete. Columns added: ${added}`);

  db.close();
  process.exit(0);
} catch (err) {
  console.error('Failed to fix video_content schema:', err);
  process.exit(1);
}