const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
  const db = new Database(dbPath);
  const rows = db.prepare(`
    SELECT id, title, LOWER(category) AS category, LOWER(content_type) AS content_type,
           LOWER(page_type) AS page_type, display_pages, is_service, tags
    FROM unified_content
    ORDER BY created_at DESC, id DESC
    LIMIT 100
  `).all();

  console.log('Sample unified_content rows (first 100):');
  console.log(rows);
  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN LOWER(category) LIKE '%service%' THEN 1 ELSE 0 END) AS service_by_category,
      SUM(CASE WHEN LOWER(content_type) = 'service' THEN 1 ELSE 0 END) AS service_by_type,
      SUM(CASE WHEN is_service = 1 THEN 1 ELSE 0 END) AS service_flag,
      SUM(CASE WHEN LOWER(page_type) = 'services' THEN 1 ELSE 0 END) AS services_page_type,
      SUM(CASE WHEN REPLACE(LOWER(display_pages), ' ', '-') LIKE '%services%' THEN 1 ELSE 0 END) AS services_display_page
    FROM unified_content
  `).get();
  console.log('Service-related stats:', stats);
} catch (e) {
  console.error('Failed inspecting unified_content:', e);
  process.exit(1);
}