const Database = require('better-sqlite3');

function run() {
  const db = new Database('database.sqlite');
  const sql = `
    SELECT id, name, display_pages, page_type, category, is_service,
           original_price as originalPrice,
           image_url as imageUrl,
           affiliate_url as affiliateUrl,
           created_at
    FROM products
    WHERE (
      is_service = 1 OR
      LOWER(category) LIKE '%service%' OR
      display_pages LIKE '%services%' OR
      REPLACE(LOWER(display_pages), ' ', '-') LIKE '%services%' OR
      LOWER(page_type) = 'services'
    )
    ORDER BY created_at DESC, id DESC
    LIMIT 50 OFFSET 0
  `;
  const rows = db.prepare(sql).all();
  console.log('Products fallback rows:', rows.length);
  console.log(rows.slice(0, 5));
}

run();