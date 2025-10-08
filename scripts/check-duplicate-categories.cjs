const Database = require('better-sqlite3');
const fs = require('fs');

function resolveDbPath() {
  const candidates = ['database.sqlite', 'server/database.sqlite', 'sqlite.db'].filter(p => fs.existsSync(p));
  if (candidates.length === 0) throw new Error('Database file not found');
  return candidates[0];
}

try {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  console.log('📂 DB:', dbPath);

  const duplicates = db.prepare("SELECT LOWER(name) AS lname, COUNT(*) AS cnt FROM categories GROUP BY LOWER(name) HAVING cnt > 1 ORDER BY cnt DESC").all();
  const parents = db.prepare("SELECT COUNT(*) AS c FROM categories WHERE parent_id IS NULL").get();
  const children = db.prepare("SELECT COUNT(*) AS c FROM categories WHERE parent_id IS NOT NULL").get();
  console.log('🔁 Duplicates:', duplicates);
  console.log('📊 Counts:', { parents: parents.c, children: children.c });

  // Sample of parents for quick look
  const sampleParents = db.prepare("SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name LIMIT 20").all();
  console.log('👀 Sample parents:', sampleParents.map(r => r.name));

  db.close();
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}