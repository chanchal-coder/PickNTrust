const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');

try {
  const row = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM unified_content
    WHERE (
      is_featured = 1 OR
      is_featured IN ('1','true','TRUE','yes','YES','y','Y','t','T')
    )
  `).get();

  console.log(row ? row.cnt : 0);
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
} finally {
  db.close();
}