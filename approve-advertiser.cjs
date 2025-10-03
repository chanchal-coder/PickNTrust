// Approve an advertiser by email for testing login flows
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

const email = process.argv[2];

if (!email) {
  const rows = db
    .prepare(
      'SELECT id, email, status, company_name FROM advertisers ORDER BY created_at DESC LIMIT 10'
    )
    .all();
  console.log('Usage: node approve-advertiser.cjs <email>');
  console.log('Recent advertisers (latest 10):');
  console.table(rows);
  process.exit(1);
}

const info = db.prepare("UPDATE advertisers SET status = 'approved' WHERE email = ?").run(email);
console.log(`Updated ${info.changes} row(s) for ${email}`);
const row = db.prepare('SELECT id, email, status FROM advertisers WHERE email = ?').get(email);
console.log('Current status:', row);