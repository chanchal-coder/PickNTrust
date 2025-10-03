// Patch server advertisers table to include password_hash (for login)
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

try {
  const cols = db.prepare("PRAGMA table_info(advertisers)").all();
  const hasPassword = cols.some(c => c.name === 'password_hash');
  if (!hasPassword) {
    db.exec("ALTER TABLE advertisers ADD COLUMN password_hash TEXT");
    console.log('✅ Added password_hash column to server advertisers table');
  } else {
    console.log('ℹ️ password_hash column already exists in server advertisers table');
  }
} catch (err) {
  console.error('❌ Failed to patch advertisers table:', err.message);
  process.exit(1);
} finally {
  db.close();
}