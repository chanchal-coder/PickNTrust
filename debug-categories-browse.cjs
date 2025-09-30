const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n=== Testing Categories Browse Query ===');
  
  // First, check if categories table exists and has data
  const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  console.log('Categories count:', categoriesCount.count);
  
  // Check if unified_content table exists and has data
  const unifiedContentCount = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
  console.log('Unified content count:', unifiedContentCount.count);
  
  // Check sample categories
  const sampleCategories = db.prepare('SELECT id, name, icon, color FROM categories LIMIT 5').all();
  console.log('\nSample categories:');
  console.table(sampleCategories);
  
  // Check sample unified_content
  const sampleContent = db.prepare('SELECT id, title, category, processing_status, visibility, status FROM unified_content LIMIT 5').all();
  console.log('\nSample unified content:');
  console.table(sampleContent);
  
  // Test the actual browse query without type filter
  const browseQuery = `
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
  
  console.log('\n=== Testing Browse Query ===');
  try {
    const browseResults = db.prepare(browseQuery).all();
    console.log('Browse results count:', browseResults.length);
    console.table(browseResults);
  } catch (error) {
    console.error('Error executing browse query:', error.message);
    
    // Let's check what's wrong with the query step by step
    console.log('\n=== Debugging Query Step by Step ===');
    
    // Test basic categories query
    try {
      const basicCategories = db.prepare('SELECT * FROM categories WHERE parent_id IS NULL').all();
      console.log('Basic categories (parent_id IS NULL):', basicCategories.length);
    } catch (err) {
      console.error('Error with basic categories query:', err.message);
    }
    
    // Test basic unified_content query
    try {
      const basicContent = db.prepare(`
        SELECT * FROM unified_content 
        WHERE processing_status = 'completed' 
        AND visibility = 'public' 
        AND status = 'active'
      `).all();
      console.log('Basic unified content (filtered):', basicContent.length);
    } catch (err) {
      console.error('Error with basic unified_content query:', err.message);
    }
    
    // Test simple join
    try {
      const simpleJoin = db.prepare(`
        SELECT c.name as category_name, uc.category as content_category, uc.title
        FROM categories c
        INNER JOIN unified_content uc ON uc.category = c.name
        LIMIT 10
      `).all();
      console.log('Simple join results:', simpleJoin.length);
      console.table(simpleJoin);
    } catch (err) {
      console.error('Error with simple join:', err.message);
    }
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}