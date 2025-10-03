const path = require('path');
const Database = require('better-sqlite3');

function getDbPath() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.length > 0) {
    if (envUrl.startsWith('file:')) {
      const p = envUrl.replace(/^file:/, '');
      return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    }
    return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
  }
  // Default to project root database.sqlite to match server usage
  return path.join(process.cwd(), 'database.sqlite');
}

try {
  const dbPath = getDbPath();
  console.log('Using database:', dbPath);
  const db = new Database(dbPath);

  const cols = db.prepare("PRAGMA table_info(unified_content)").all();
  const colNames = new Set(cols.map(c => c.name));
  console.log('Current unified_content columns:', cols.map(c => `${c.name}:${c.type}`).join(', '));

  if (!colNames.has('discount')) {
    console.log('Adding missing column: discount INTEGER');
    db.exec("ALTER TABLE unified_content ADD COLUMN discount INTEGER");
    console.log('Column added: discount');
  } else {
    console.log('Column already exists: discount');
  }

  const updated = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('Updated unified_content columns:', updated.map(c => `${c.name}:${c.type}`).join(', '));

  db.close();
  console.log('Done.');
  process.exit(0);
} catch (err) {
  console.error('Failed to add discount column:', err);
  process.exit(1);
}