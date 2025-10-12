const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');

function tableExists(name) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name);
  return !!row;
}

function countFeatured(table) {
  const sql = `SELECT COUNT(*) AS cnt FROM ${table} WHERE (
    is_featured = 1 OR is_featured IN ('1','true','TRUE','yes','YES','y','Y','t','T')
  )`;
  const row = db.prepare(sql).get();
  return row ? row.cnt : 0;
}

try {
  const tables = ['unified_content', 'unified'];
  for (const t of tables) {
    if (tableExists(t)) {
      const cnt = countFeatured(t);
      console.log(`${t}: ${cnt}`);
    } else {
      console.log(`${t}: (table not found)`);
    }
  }
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
} finally {
  db.close();
}