const Database = require('better-sqlite3');

const db = new Database('server/database.sqlite');

console.log('=== DEBUGGING DATA MISMATCH ===\n');

// 1. Check categories table
console.log('1. Categories table:');
const categories = db.prepare('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY display_order').all();
console.table(categories);

// 2. Check unified_content table with relevant fields
console.log('\n2. Unified content table (relevant fields):');
const content = db.prepare(`
  SELECT id, title, category, processing_status, visibility, status, is_service, is_ai_app 
  FROM unified_content 
  LIMIT 10
`).all();
console.table(content);

// 3. Check for exact matches
console.log('\n3. Testing exact category matches:');
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

// 4. Check what categories exist in unified_content
console.log('\n4. Unique categories in unified_content:');
const uniqueCategories = db.prepare(`
  SELECT DISTINCT category, COUNT(*) as count 
  FROM unified_content 
  WHERE processing_status = 'completed'
    AND visibility = 'public' 
    AND status = 'active'
  GROUP BY category
`).all();
console.table(uniqueCategories);

// 5. Test the complex join conditions
console.log('\n5. Testing complex join conditions:');
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

db.close();