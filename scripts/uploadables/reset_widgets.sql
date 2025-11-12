BEGIN TRANSACTION;
DROP TABLE IF EXISTS widgets;
CREATE TABLE IF NOT EXISTS widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  body TEXT,
  code TEXT,
  target_page TEXT NOT NULL,
  position TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  max_width INTEGER,
  custom_css TEXT,
  show_on_mobile INTEGER DEFAULT 1,
  show_on_desktop INTEGER DEFAULT 1,
  external_link TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
INSERT INTO widgets (
  name, description, body, code, target_page, position, is_active, display_order,
  max_width, custom_css, show_on_mobile, show_on_desktop, external_link
) VALUES (
  'Homepage Top Content', NULL, 'Welcome to PickNTrust', NULL, 'home', 'content-top', 1,
  1, NULL, NULL, 1, 1, NULL
);
COMMIT;