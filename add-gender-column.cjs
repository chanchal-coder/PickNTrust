const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Adding missing gender column to unified_content if needed...');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('📁 Database:', dbPath);

const db = new Database(dbPath);

try {
  const cols = db.prepare("PRAGMA table_info(unified_content)").all();
  const names = cols.map(c => c.name);
  console.log('📋 Current columns:', names);

  if (!names.includes('gender')) {
    console.log('➕ Adding column: gender TEXT');
    db.prepare('ALTER TABLE unified_content ADD COLUMN gender TEXT').run();
    console.log('✅ gender column added');
  } else {
    console.log('✅ gender column already exists');
  }

  // Verify
  const verify = db.prepare("PRAGMA table_info(unified_content)").all().map(c => c.name);
  console.log('🔎 Verified columns:', verify);
} catch (err) {
  console.error('❌ Failed to add gender column:', err.message);
  process.exitCode = 1;
} finally {
  db.close();
}