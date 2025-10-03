// Approve an advertiser in the server database by email
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

const email = process.argv[2];

if (!email) {
  const rows = db
    .prepare(
      'SELECT id, email, status, company_name FROM advertisers ORDER BY created_at DESC LIMIT 10'
    )
    .all();
  console.log('Usage: node approve-advertiser-server.cjs <email>');
  console.log('Recent advertisers (latest 10 in server DB):');
  console.table(rows);
  process.exit(1);
}

try {
  const info = db.prepare("UPDATE advertisers SET status = 'approved' WHERE email = ?").run(email);
  console.log(`✅ Updated ${info.changes} row(s) for ${email}`);
  const row = db.prepare('SELECT id, email, status FROM advertisers WHERE email = ?').get(email);
  console.log('Current status:', row);
} catch (err) {
  console.error('❌ Failed to approve advertiser:', err.message);
  process.exit(1);
} finally {
  db.close();
}