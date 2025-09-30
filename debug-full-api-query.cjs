const Database = require('better-sqlite3');

const db = new Database('server/database.sqlite');

console.log('=== DEBUGGING FULL API QUERY ===\n');

// Test the exact query from the API
const query = `
  SELECT 
    c.id,
    c.name,
    c.icon,
    c.color,
    c.description,
    c.parent_id as parentId,
    c.is_for_products as isForProducts,
    c.is_for_services as isForServices,
    c.is_for_ai_apps as isForAIApps,
    c.display_order as displayOrder,
    COUNT(uc.id) as total_products_count,
    COUNT(CASE WHEN uc.is_featured = 1 THEN 1 END) as featured_count,
    COUNT(CASE WHEN uc.is_service = 1 THEN 1 END) as services_count,
    COUNT(CASE WHEN uc.is_ai_app = 1 THEN 1 END) as apps_count
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
`;

console.log('1. Full API query result:');
const result = db.prepare(query).all();
console.table(result);

// Test without the GROUP BY and HAVING clauses
const simpleQuery = `
  SELECT 
    c.name as category_name,
    uc.category as content_category,
    uc.processing_status,
    uc.visibility,
    uc.status,
    uc.title
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
`;

console.log('\n2. Simple join result (without GROUP BY):');
const simpleResult = db.prepare(simpleQuery).all();
console.table(simpleResult);

// Check if there are any records that don't meet the WHERE conditions
console.log('\n3. All unified_content records with their status:');
const allContent = db.prepare(`
  SELECT title, category, processing_status, visibility, status 
  FROM unified_content 
  ORDER BY category
`).all();
console.table(allContent);

db.close();