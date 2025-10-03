// Patch advertiser_payments table to include missing currency column in both root and server databases
const Database = require('better-sqlite3');
const path = require('path');

function patchDb(dbPath) {
  const db = new Database(dbPath);
  try {
    const cols = db.prepare("PRAGMA table_info(advertiser_payments)").all();
    const names = cols.map(c => c.name);
    if (!names.includes('currency')) {
      db.exec("ALTER TABLE advertiser_payments ADD COLUMN currency TEXT");
      console.log(`✅ Added currency column to advertiser_payments in ${dbPath}`);
    } else {
      console.log(`ℹ️ currency column already exists in ${dbPath}`);
    }
  } catch (err) {
    console.error(`❌ Failed to patch ${dbPath}:`, err.message);
  } finally {
    db.close();
  }
}

const rootDb = path.join(__dirname, 'database.sqlite');
const serverDb = path.join(__dirname, 'server', 'database.sqlite');

patchDb(rootDb);
patchDb(serverDb);