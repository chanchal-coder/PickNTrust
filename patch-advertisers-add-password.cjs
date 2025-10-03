// Add missing password_hash column to advertisers table in root database
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  const cols = db.prepare("PRAGMA table_info(advertisers)").all();
  const names = cols.map(c => c.name);
  if (!names.includes('password_hash')) {
    db.exec("ALTER TABLE advertisers ADD COLUMN password_hash TEXT");
    console.log('Success Added password_hash column to advertisers');
  } else {
    console.log('Info password_hash column already exists');
  }
} catch (err) {
  console.error('Error Failed to patch advertisers table:', err.message);
} finally {
  db.close();
}