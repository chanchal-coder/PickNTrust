const Database = require('better-sqlite3');
const path = require('path');

// Connect to the same root database used by servers
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Backfilling categories from unified_content...');

try {
  db.exec('BEGIN');

  // Gather distinct categories with content type flags
  const distinct = db.prepare(`
    SELECT 
      TRIM(category) AS category,
      COUNT(*) AS totalCount,
      SUM(CASE WHEN is_service = 1 THEN 1 ELSE 0 END) AS serviceCount,
      SUM(CASE WHEN is_ai_app = 1 THEN 1 ELSE 0 END) AS aiAppCount,
      SUM(CASE WHEN (is_service IS NULL OR is_service = 0) AND (is_ai_app IS NULL OR is_ai_app = 0) THEN 1 ELSE 0 END) AS productCount
    FROM unified_content
    WHERE category IS NOT NULL AND category != ''
      AND (status = 'active' OR status = 'published' OR status IS NULL)
      AND (visibility = 'public' OR visibility IS NULL)
      AND (processing_status = 'active' OR processing_status = 'completed' OR processing_status IS NULL)
    GROUP BY TRIM(category)
    ORDER BY totalCount DESC
  `).all();

  const findCategory = db.prepare(`SELECT id, is_active FROM categories WHERE LOWER(name) = LOWER(?)`);
  const insertCategory = db.prepare(`
    INSERT INTO categories (
      name, description, icon, color, parent_id, display_order,
      is_for_products, is_for_services, is_for_ai_apps, is_active
    ) VALUES (?, '', 'mdi-tag', '#888888', NULL, 0, ?, ?, ?, 1)
  `);
  const updateFlags = db.prepare(`
    UPDATE categories
    SET is_for_products = CASE WHEN ? > 0 THEN 1 ELSE is_for_products END,
        is_for_services = CASE WHEN ? > 0 THEN 1 ELSE is_for_services END,
        is_for_ai_apps = CASE WHEN ? > 0 THEN 1 ELSE is_for_ai_apps END,
        is_active = 1
    WHERE id = ?
  `);

  let inserted = 0;
  let updated = 0;

  for (const row of distinct) {
    const { category, productCount, serviceCount, aiAppCount } = row;
    if (!category) continue;

    const existing = findCategory.get(category);
    if (!existing) {
      insertCategory.run(
        category,
        productCount > 0 ? 1 : 0,
        serviceCount > 0 ? 1 : 0,
        aiAppCount > 0 ? 1 : 0
      );
      inserted++;
    } else {
      updateFlags.run(productCount, serviceCount, aiAppCount, existing.id);
      updated++;
    }
  }

  db.exec('COMMIT');
  console.log(`✅ Backfill complete. Inserted: ${inserted}, Updated: ${updated}`);
} catch (err) {
  console.error('❌ Backfill failed:', err.message);
  try { db.exec('ROLLBACK'); } catch {}
  process.exitCode = 1;
} finally {
  db.close();
}