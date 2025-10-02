const Database = require('better-sqlite3');

function main() {
  const db = new Database('./database.sqlite');
  const now = Math.floor(Date.now() / 1000);
  const name = 'google-site-verification';
  const content = 'AUTO-EC2-03';
  const provider = 'Google';
  const purpose = 'Site Verification';
  const isActive = 1;

  try {
    const existing = db.prepare('SELECT id FROM meta_tags WHERE name = ?').get(name);
    if (existing && existing.id) {
      console.log('Meta tag already exists with id:', existing.id);
      return;
    }
    const stmt = db.prepare('INSERT INTO meta_tags (name, content, provider, purpose, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, content, provider, purpose, isActive, now, now);
    console.log('Inserted meta tag with id:', info.lastInsertRowid);
  } catch (e) {
    console.error('Error inserting meta tag:', e);
    process.exitCode = 1;
  } finally {
    try { db.close(); } catch {}
  }
}

main();