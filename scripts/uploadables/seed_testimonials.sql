BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT,
  quote TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
INSERT INTO testimonials (author, quote, is_active)
SELECT 'System','Welcome to PickNTrust',1
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE is_active=1);
COMMIT;