const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const testMetaTag = {
  name: 'google-site-verification',
  content: 'test-verification-code-12345',
  provider: 'Google',
  purpose: 'Site Verification',
  is_active: 1
};

db.run(`
  INSERT INTO meta_tags (name, content, provider, purpose, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`, [testMetaTag.name, testMetaTag.content, testMetaTag.provider, testMetaTag.purpose, testMetaTag.is_active], function(err) {
  if (err) {
    console.error('Error inserting test meta tag:', err);
  } else {
    console.log('✅ Test meta tag inserted successfully with ID:', this.lastID);
  }
  db.close();
});