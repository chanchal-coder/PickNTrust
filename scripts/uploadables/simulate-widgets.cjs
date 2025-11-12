/* Simulate widget-routes SQL against active DB to detect SQL errors */
const Database = require('better-sqlite3');

function simulate() {
  const dbPath = process.env.DB_PATH || '/home/ec2-user/pickntrust/database.sqlite';
  const db = new Database(dbPath);
  try { db.pragma('journal_mode = WAL'); } catch {}

  const position = 'content-top';
  const positionsToQuery = [position];
  const placeholders = positionsToQuery.map(() => '?').join(', ');
  const sql = `
    SELECT * FROM widgets 
    WHERE target_page = ? 
      AND position IN (${placeholders}) 
      AND is_active = 1
      AND LOWER(name) NOT LIKE '%fallback%'
      AND LOWER(name) NOT LIKE '%test%'
      AND (description IS NULL OR LOWER(description) NOT LIKE '%test%')
    ORDER BY display_order
  `;
  try {
    const rows = db.prepare(sql).all('home', ...positionsToQuery);
    console.log('Rows:', rows);
  } catch (e) {
    console.error('SQL ERROR:', e && e.message ? e.message : e);
    console.error('SQL WAS:', sql);
    process.exit(2);
  }
}

try {
  simulate();
} catch (e) {
  console.error('SIM_FAIL:', e && e.message ? e.message : e);
  process.exit(1);
}