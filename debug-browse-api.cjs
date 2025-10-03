const Database = require('better-sqlite3');
const path = require('path');

// Connect to the root database used by the server (server/db.ts resolves to projectRoot/database.sqlite)
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Debugging browse categories API...\n');

// First, let's check what's in the categories table
console.log('1. Categories table content (top 50):');
const categories = db.prepare(`
  SELECT id, name, parent_id, is_active, is_for_products, is_for_services, is_for_ai_apps
  FROM categories
  ORDER BY name ASC
  LIMIT 50
`).all();
console.log(categories);

// Check unified_content table
console.log('\n2. Unified content table sample:');
const unifiedContent = db.prepare(`
  SELECT id, title, category, processing_status, visibility, status, display_pages
  FROM unified_content
  LIMIT 10
`).all();
console.log(unifiedContent);

// Check the browse API-like query using name-based matching (reflects server/routes.ts logic)
console.log('\n3. Running the browse-like query:');
const browseQuery = `
  SELECT 
    c.id,
    c.name,
    c.parent_id AS parentId,
    c.icon,
    c.color,
    c.description,
    c.is_for_products AS isForProducts,
    c.is_for_services AS isForServices,
    c.is_for_ai_apps AS isForAiApps,
    c.display_order AS displayOrder,
    COUNT(uc.id) AS productCount
  FROM categories c
  INNER JOIN unified_content uc ON (
      uc.category = c.name
      OR REPLACE(uc.category, 's', '') = REPLACE(c.name, 's', '')
      OR REPLACE(uc.category, 'Services', 'Service') = REPLACE(c.name, 'Services', 'Service')
      OR REPLACE(uc.category, 'Service', 'Services') = REPLACE(c.name, 'Service', 'Services')
    )
    AND uc.processing_status = 'completed'
    AND uc.visibility = 'public'
    AND (uc.status = 'active' OR uc.status = 'published' OR uc.status IS NULL)
  WHERE c.parent_id IS NULL
    AND c.is_active = 1
  GROUP BY c.id, c.name, c.parent_id, c.icon, c.color, c.description, c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
  HAVING COUNT(uc.id) > 0
  ORDER BY c.display_order ASC, c.name ASC
`;
const browseResult = db.prepare(browseQuery).all();
console.log('Browse-like Query Result:', browseResult);

// Check unified_content matching criteria and distribution across categories
console.log('\n4. Matching unified_content records summary:');
const matchingCount = db.prepare(`
  SELECT category, COUNT(*) AS count
  FROM unified_content
  WHERE processing_status = 'completed'
    AND visibility = 'public'
    AND (status = 'active' OR status = 'published' OR status IS NULL)
  GROUP BY category
  ORDER BY count DESC
  LIMIT 50
`).all();
console.log(matchingCount);

// Show all distinct categories present in unified_content for comparison
console.log('\n6. Distinct unified_content categories (top 50):');
const distinctCategories = db.prepare(`
  SELECT category, COUNT(*) AS count
  FROM unified_content
  GROUP BY category
  ORDER BY count DESC
  LIMIT 50
`).all();
console.log(distinctCategories);

// Check what display_pages values exist
console.log('\n5. All display_pages values:');
const displayPages = db.prepare(`
  SELECT DISTINCT display_pages, COUNT(*) as count
  FROM unified_content
  GROUP BY display_pages
  ORDER BY count DESC
`).all();
console.log(displayPages);
// Additional diagnostics: distinct status and visibility values
try {
  const distinctStatuses = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM unified_content
    GROUP BY status
    ORDER BY count DESC
  `).all();
  console.log('\n7. Distinct status values:', distinctStatuses);

  const distinctVisibility = db.prepare(`
    SELECT visibility, COUNT(*) AS count
    FROM unified_content
    GROUP BY visibility
    ORDER BY count DESC
  `).all();
  console.log('\n8. Distinct visibility values:', distinctVisibility);

  const distinctProcessing = db.prepare(`
    SELECT processing_status, COUNT(*) AS count
    FROM unified_content
    GROUP BY processing_status
    ORDER BY count DESC
  `).all();
  console.log('\n9. Distinct processing_status values:', distinctProcessing);
} catch (e) {
  console.log('Diagnostics error:', e.message);
}
db.close();