const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}

try {
  // Ensure columns exist defensively
  const cols = db.prepare("PRAGMA table_info(unified_content)").all().map(c => c.name);
  const ensureCol = (name, type, defaultExpr = null) => {
    if (!cols.includes(name)) {
      db.exec(`ALTER TABLE unified_content ADD COLUMN ${name} ${type}`);
      if (defaultExpr !== null) {
        db.exec(`UPDATE unified_content SET ${name} = ${defaultExpr} WHERE ${name} IS NULL`);
      }
    }
  };
  ensureCol('is_service', 'INTEGER DEFAULT 0', 0);
  ensureCol('is_ai_app', 'INTEGER DEFAULT 0', 0);
  ensureCol('processing_status', "TEXT DEFAULT 'completed'", "'completed'");
  ensureCol('visibility', "TEXT DEFAULT 'public'", "'public'");
  ensureCol('status', "TEXT DEFAULT 'active'", "'active'");
  ensureCol('created_at', "TEXT DEFAULT (datetime('now'))");

  // Normalize service items
  run(
    `UPDATE unified_content
     SET is_service = 1,
         processing_status = 'completed',
         visibility = 'public',
         status = 'active'
     WHERE LOWER(content_type) = 'service' OR LOWER(category) LIKE '%service%'`
  );

  // Normalize app items (include ai-app)
  run(
    `UPDATE unified_content
     SET is_ai_app = 1,
         processing_status = 'completed',
         visibility = 'public',
         status = 'active'
     WHERE LOWER(content_type) IN ('app', 'ai-app') OR LOWER(category) LIKE '%app%' OR LOWER(category) LIKE '%ai%'`
  );

  console.log('✅ Normalized unified_content flags and statuses');
} catch (e) {
  console.error('❌ Failed to normalize unified_content:', e.message);
  process.exit(1);
} finally {
  db.close();
}