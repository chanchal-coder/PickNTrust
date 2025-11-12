BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS meta_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  title TEXT,
  description TEXT,
  keywords TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
INSERT INTO meta_tags (page, title, description, keywords)
SELECT 'home','PickNTrust','Shopping categories, announcements and blogs','shopping,categories,blogs'
WHERE NOT EXISTS (SELECT 1 FROM meta_tags WHERE page='home');
COMMIT;