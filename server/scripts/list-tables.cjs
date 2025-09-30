// Utility script to list all tables in the SQLite database
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
  return path.join(process.cwd(), 'database.sqlite');
}

const dbPath = getDbPath();
const db = new Database(dbPath);
const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('DB Path:', dbPath);
for (const r of rows) {
  console.log(r.name);
}