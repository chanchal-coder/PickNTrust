BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS meta_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  content TEXT,
  provider TEXT,
  purpose TEXT,
  is_active INTEGER DEFAULT 1,
  raw_html TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
INSERT INTO meta_tags (name, content, provider, purpose, is_active, raw_html)
SELECT 'description', 'PickNTrust', 'Custom', 'Site Description', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM meta_tags WHERE is_active = 1);
COMMIT;