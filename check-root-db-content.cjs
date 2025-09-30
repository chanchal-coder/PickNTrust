const Database = require('better-sqlite3');

console.log('=== CHECKING ROOT DATABASE CONTENT ===\n');

// Use the exact same path as the server
const db = new Database('database.sqlite');

console.log('1. Categories in root database:');
const categories = db.prepare('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY display_order').all();
console.table(categories);

console.log('\n2. Unified content in root database:');
const content = db.prepare(`
  SELECT id, title, category, processing_status, visibility, status, is_service, is_ai_app 
  FROM unified_content 
  ORDER BY category
`).all();
console.table(content);

console.log('\n3. Testing category matches:');
categories.forEach(cat => {
  const matches = db.prepare(`
    SELECT COUNT(*) as count 
    FROM unified_content 
    WHERE category = ? 
      AND processing_status = 'completed'
      AND visibility = 'public' 
      AND status = 'active'
  `).get(cat.name);
  console.log(`${cat.name}: ${matches.count} matches`);
});

console.log('\n4. Testing complex join conditions:');
categories.forEach(cat => {
  const query = `
    SELECT COUNT(*) as count 
    FROM unified_content uc
    WHERE (
      uc.category = ?
      OR uc.category = REPLACE(?, 's', '')
      OR uc.category = ? || 's'
      OR (? = 'Technology Services' AND uc.category = 'Technology Service')
      OR (? = 'AI Photo Apps' AND uc.category = 'AI Photo App')
      OR (? = 'AI Applications' AND uc.category = 'AI App')
    )
    AND uc.processing_status = 'completed'
    AND uc.visibility = 'public'
    AND uc.status = 'active'
  `;
  
  const result = db.prepare(query).get(cat.name, cat.name, cat.name, cat.name, cat.name, cat.name);
  console.log(`${cat.name}: ${result.count} matches with complex conditions`);
});

console.log('\n5. Full API query test:');
const apiQuery = `
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
`;

const apiResult = db.prepare(apiQuery).all();
console.table(apiResult);

db.close();