const Database = require('better-sqlite3');

const db = new Database('server/database.sqlite');

console.log('=== DEBUGGING GROUP BY ISSUE ===\n');

// 1. Check the exact schema of categories table
console.log('1. Categories table schema:');
const schema = db.prepare("PRAGMA table_info(categories)").all();
console.table(schema);

// 2. Test a simpler GROUP BY query
console.log('\n2. Simple GROUP BY test:');
const simpleGroupBy = db.prepare(`
  SELECT 
    c.id,
    c.name,
    COUNT(uc.id) as total_products_count
  FROM categories c
  INNER JOIN unified_content uc ON (
    uc.category = c.name 
    OR uc.category = REPLACE(c.name, 's', '')
    OR uc.category = c.name || 's'
    OR (c.name = 'Technology Services' AND uc.category = 'Technology Service')
    OR (c.name = 'AI Photo Apps' AND uc.category = 'AI Photo App')
    OR (c.name = 'AI Applications' AND uc.category = 'AI App')
  )
  WHERE c.parent_id IS NULL
    AND uc.processing_status = 'completed'
    AND uc.visibility = 'public'
    AND uc.status = 'active'
  GROUP BY c.id, c.name
  HAVING COUNT(uc.id) > 0
  ORDER BY c.name ASC
`).all();
console.table(simpleGroupBy);

// 3. Test without aliases
console.log('\n3. Test without column aliases:');
const noAliases = db.prepare(`
  SELECT 
    c.id,
    c.name,
    c.icon,
    c.color,
    c.description,
    c.parent_id,
    c.is_for_products,
    c.is_for_services,
    c.is_for_ai_apps,
    c.display_order,
    COUNT(uc.id) as total_products_count
  FROM categories c
  INNER JOIN unified_content uc ON (
    uc.category = c.name 
    OR uc.category = REPLACE(c.name, 's', '')
    OR uc.category = c.name || 's'
    OR (c.name = 'Technology Services' AND uc.category = 'Technology Service')
    OR (c.name = 'AI Photo Apps' AND uc.category = 'AI Photo App')
    OR (c.name = 'AI Applications' AND uc.category = 'AI App')
  )
  WHERE c.parent_id IS NULL
    AND uc.processing_status = 'completed'
    AND uc.visibility = 'public'
    AND uc.status = 'active'
  GROUP BY c.id, c.name, c.icon, c.color, c.description, c.parent_id, c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
  HAVING COUNT(uc.id) > 0
  ORDER BY c.display_order ASC, c.name ASC
`).all();
console.table(noAliases);

db.close();