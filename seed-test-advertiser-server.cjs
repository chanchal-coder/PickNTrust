const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

const email = process.argv[2] || 'flow.tester@example.com';
const company = process.argv[3] || 'FlowCo';
const contact = process.argv[4] || 'Flow Tester';

try {
  const existing = db.prepare('SELECT id, email FROM advertisers WHERE email = ?').get(email);
  if (existing) {
    console.log(`Advertiser already exists in server DB: id=${existing.id}, email=${existing.email}`);
    process.exit(0);
  }

  const insert = db.prepare(`
    INSERT INTO advertisers (
      company_name, contact_person, email, phone, website_url, business_type, status, payment_method, billing_address
    ) VALUES (?, ?, ?, ?, ?, ?, 'approved', 'card', '456 Flow St')
  `);
  const info = insert.run(company, contact, email, '9999999999', 'https://flow.example.com', 'Tech');
  console.log(`Inserted server advertiser id=${info.lastInsertRowid}`);
} catch (err) {
  console.error('Failed to seed server advertiser:', err.message);
} finally {
  db.close();
}