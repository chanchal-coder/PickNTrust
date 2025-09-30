const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Debugging API endpoint logic...\n');

// Simulate the exact API logic
function simulateAPIEndpoint(type = undefined) {
  try {
    let typeFilter = '';
    
    // Add type filtering if specified
    if (type && type !== 'all') {
      if (type === 'products') {
        typeFilter = ` AND (uc.is_service IS NULL OR uc.is_service = 0) AND (uc.is_ai_app IS NULL OR uc.is_ai_app = 0)`;
      } else if (type === 'services') {
        typeFilter = ` AND uc.is_service = 1`;
      } else if (type === 'aiapps') {
        typeFilter = ` AND uc.is_ai_app = 1`;
      }
    }
    
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
        ${typeFilter}
      GROUP BY c.id, c.name, c.icon, c.color, c.description, c.parent_id, c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
      HAVING COUNT(uc.id) > 0
      ORDER BY c.display_order ASC, c.name ASC
    `;
    
    console.log('Query with typeFilter:', typeFilter);
    console.log('Full query:', query);
    
    const categories = db.prepare(query).all();
    return categories;
  } catch (error) {
    console.error('Error in simulated API:', error);
    return [];
  }
}

// Test without type filter
console.log('1. Testing without type filter:');
const result1 = simulateAPIEndpoint();
console.log('Result:', JSON.stringify(result1, null, 2));

// Test with products filter
console.log('\n2. Testing with products filter:');
const result2 = simulateAPIEndpoint('products');
console.log('Result:', JSON.stringify(result2, null, 2));

// Test the query step by step
console.log('\n3. Testing query step by step:');

// First, check if the basic join works
const basicJoin = db.prepare(`
  SELECT c.name, uc.category, COUNT(*) as count
  FROM categories c
  INNER JOIN unified_content uc ON uc.category = c.name
  WHERE c.parent_id IS NULL
  GROUP BY c.name, uc.category
`).all();
console.log('Basic join results:', basicJoin);

// Check with all conditions
const withConditions = db.prepare(`
  SELECT c.name, COUNT(uc.id) as count
  FROM categories c
  INNER JOIN unified_content uc ON uc.category = c.name
  WHERE c.parent_id IS NULL
    AND uc.processing_status = 'completed'
    AND uc.visibility = 'public'
    AND uc.status = 'active'
  GROUP BY c.name
`).all();
console.log('With conditions:', withConditions);

db.close();