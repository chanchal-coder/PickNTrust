/* Inspect widgets schema and sample data on server DB */
const Database = require('better-sqlite3');

function run() {
  const dbPath = process.env.DB_PATH || '/var/www/pickntrust/database.sqlite';
  const db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
  } catch {}

  const cols = db.prepare("PRAGMA table_info(widgets)").all();
  console.log('widgets columns:', cols.map(c => c.name));

  const count = db.prepare("SELECT COUNT(*) as c FROM widgets").get().c;
  console.log('widgets count:', count);

  const sample = db.prepare(
    "SELECT id, name, target_page, position, is_active, display_order FROM widgets WHERE target_page = ? AND position = ? ORDER BY display_order LIMIT 5"
  ).all('home', 'content-top');
  console.log('home/content-top sample:', sample);

  const anySample = db.prepare(
    "SELECT id, name, target_page, position, is_active, display_order FROM widgets ORDER BY created_at DESC LIMIT 5"
  ).all();
  console.log('any sample:', anySample);
}

try {
  run();
} catch (e) {
  console.error('INSPECT_ERROR:', e && e.message ? e.message : e);
  process.exit(1);
}