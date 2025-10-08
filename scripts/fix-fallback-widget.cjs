const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function log(msg) {
  console.log(`[fix-fallback-widget] ${msg}`);
}

function resolveDbPath() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.length > 0) {
    if (envUrl.startsWith('file:')) {
      const p = envUrl.replace(/^file:/, '');
      return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    }
    return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
  }
  const cwdPath = path.join(process.cwd(), 'database.sqlite');
  const candidates = [
    path.join(process.cwd(), 'database.sqlite'),
    path.join(__dirname, '..', 'dist', 'database.sqlite'),
    path.join(__dirname, '..', 'dist', 'server', 'database.sqlite'),
    path.join(process.cwd(), '..', 'database.sqlite'),
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return cwdPath;
}

try {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  log(`Opened database ${dbPath}`);

  // Ensure widgets table exists
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='widgets'").get();
  if (!tableCheck) {
    log('ERROR: widgets table not found. Skipping.');
    db.close();
    process.exit(0);
  }

  // Check for an active PrimePicks header widget
  const existing = db
    .prepare(
      "SELECT id, name, is_active, show_on_desktop, show_on_mobile FROM widgets WHERE target_page = ? AND position = ? AND is_active = 1 LIMIT 1"
    )
    .get('prime-picks', 'header');

  if (existing) {
    log(`Found active PrimePicks header widget (ID ${existing.id}, name: ${existing.name}). Ensuring desktop/mobile flags are enabled.`);
    db.prepare(
      'UPDATE widgets SET show_on_desktop = 1, show_on_mobile = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(existing.id);
  } else {
    log('No active PrimePicks header widget found. Creating fallback widget...');
    const insert = db.prepare(
      `INSERT INTO widgets (
        name, code, target_page, position, is_active, display_order,
        max_width, custom_css, show_on_mobile, show_on_desktop, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );

    const code = `\n<div class="primepicks-fallback-banner" style="width:100%;padding:12px;background:#4F46E5;color:white;text-align:center">\n  PrimePicks deals loading...\n</div>\n`;
    const customCss = '.primepicks-fallback-banner{font-weight:600;letter-spacing:0.2px}';

    const result = insert.run(
      'PrimePicks Fallback Banner',
      code,
      'prime-picks',
      'header',
      1,
      0,
      '100%',
      customCss,
      1,
      1
    );
    log(`Created fallback widget with ID ${result.lastInsertRowid}`);
  }

  // Final verification
  const verify = db.prepare(
    "SELECT id, name, is_active, show_on_desktop, show_on_mobile FROM widgets WHERE target_page = ? AND position = ? ORDER BY id DESC LIMIT 3"
  ).all('prime-picks', 'header');
  verify.forEach(w => {
    log(`Widget ID ${w.id} name=${w.name} active=${w.is_active} desktop=${w.show_on_desktop} mobile=${w.show_on_mobile}`);
  });

  db.close();
  log('Done.');
} catch (err) {
  console.error('[fix-fallback-widget] ERROR:', err.message);
  process.exit(0);
}