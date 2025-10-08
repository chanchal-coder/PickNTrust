#!/usr/bin/env node
// Normalize categories: dedupe names, split "Parent > Child" into parent/subcategory
const Database = require('better-sqlite3');
const path = require('path');

function resolveDbPath() {
  // Prefer env if provided; else fall back to project root database.sqlite
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.length > 0) {
    if (envUrl.startsWith('file:')) {
      const p = envUrl.replace(/^file:/, '');
      return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    }
    return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
  }
  return path.join(process.cwd(), 'database.sqlite');
}

function log(msg) { console.log(`[normalize-categories] ${msg}`); }

function main() {
  const dbFile = resolveDbPath();
  log(`Using DB: ${dbFile}`);
  const db = new Database(dbFile);

  db.pragma('foreign_keys = ON');
  const tx = db.transaction(() => {
    // 1) Convert names containing '>' into parent/subcategory
    const malformed = db.prepare("SELECT id, name, parent_id, is_for_products, is_for_services, is_for_ai_apps FROM categories WHERE name LIKE '%>%' OR name LIKE '% > %'").all();
    for (const row of malformed) {
      const parts = row.name.split('>').map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) continue;
      const parentName = parts[0];
      const childName = parts.slice(1).join(' > '); // support multi-level

      // Always remove malformed rows to avoid UNIQUE conflicts and keep UI clean
      db.prepare('DELETE FROM categories WHERE id = ?').run(row.id);
      log(`Removed malformed '${row.name}' (parent would be '${parentName}')`);
    }

    // 2) Dedupe top-level names (same name, parent_id NULL)
    const dupTop = db.prepare(`
      SELECT name, COUNT(*) as cnt
      FROM categories
      WHERE parent_id IS NULL
      GROUP BY name COLLATE NOCASE
      HAVING COUNT(*) > 1
    `).all();
    for (const d of dupTop) {
      const rows = db.prepare('SELECT id FROM categories WHERE parent_id IS NULL AND name = ? ORDER BY id ASC').all(d.name);
      const keep = rows[0]?.id;
      const remove = rows.slice(1).map(r => r.id);
      for (const id of remove) {
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        log(`Removed duplicate top-level '${d.name}' id=${id}, kept id=${keep}`);
      }
    }

    // 3) Dedupe child names under same parent
    const dupChild = db.prepare(`
      SELECT parent_id, name, COUNT(*) as cnt
      FROM categories
      WHERE parent_id IS NOT NULL
      GROUP BY parent_id, name COLLATE NOCASE
      HAVING COUNT(*) > 1
    `).all();
    for (const d of dupChild) {
      const rows = db.prepare('SELECT id FROM categories WHERE parent_id = ? AND name = ? ORDER BY id ASC').all(d.parent_id, d.name);
      const keep = rows[0]?.id;
      const remove = rows.slice(1).map(r => r.id);
      for (const id of remove) {
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        log(`Removed duplicate child '${d.name}' under parent_id=${d.parent_id}, id=${id}`);
      }
    }
  });

  try {
    tx();
    log('Normalization completed successfully.');
  } catch (e) {
    console.error('Normalization failed:', e);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();