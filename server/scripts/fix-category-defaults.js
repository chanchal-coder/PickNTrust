// Migration helper: audit and optionally fix category flags
// Usage:
//  - Dry run:    `node server/scripts/fix-category-defaults.js`
//  - Apply fix:  `APPLY_CHANGES=1 node server/scripts/fix-category-defaults.js`

import Database from 'better-sqlite3';
import { getDatabasePath } from '../config/database.js';

const dbFile = getDatabasePath();
const sqlite = new Database(dbFile);

const rows = sqlite
  .prepare(`
    SELECT id, name, is_for_products, is_for_services, is_for_ai_apps, display_order
    FROM categories
    WHERE is_for_products = 1 AND is_for_services = 0 AND is_for_ai_apps = 0
    ORDER BY id
  `)
  .all();

console.log(`[migrate] Found ${rows.length} product-only categories with no other flags.`);

const apply = process.env.APPLY_CHANGES === '1';
let changed = 0;

if (apply) {
  const update = sqlite.prepare(
    `UPDATE categories SET is_for_products = 0, updated_at = strftime('%s','now') WHERE id = ?`
  );
  const tx = sqlite.transaction((items) => {
    for (const r of items) {
      const shouldFix = /services|apps/i.test(r.name);
      if (shouldFix) {
        update.run(r.id);
        changed++;
        console.log(`[migrate] Updated ID ${r.id} (${r.name}) -> is_for_products=0`);
      } else {
        console.log(`[migrate] Skipped ID ${r.id} (${r.name}) - name does not indicate Services/Apps`);
      }
    }
  });
  tx(rows);
  console.log(`[migrate] Done. ${changed} categories updated.`);
} else {
  console.log('[migrate] DRY RUN. Set APPLY_CHANGES=1 to apply fixes.');
  for (const r of rows) {
    const wouldFix = /services|apps/i.test(r.name);
    if (wouldFix) {
      console.log(`[dry-run] Would update ID ${r.id} (${r.name}) -> is_for_products=0`);
    } else {
      console.log(`[dry-run] Would skip ID ${r.id} (${r.name})`);
    }
  }
}

sqlite.close();