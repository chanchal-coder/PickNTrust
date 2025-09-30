const Database = require('better-sqlite3');
const path = require('path');

// Connect to the root database used by the server (server/db.ts resolves to projectRoot/database.sqlite)
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Debugging browse categories API...\n');

// First, let's check what's in the categories table
console.log('1. Categories table content:');
const categories = db.prepare(`
  SELECT id, name, parent_id, is_for_products, is_for_services, is_for_ai_apps
  FROM categories
`).all();
console.log(categories);

// Check unified_content table
console.log('\n2. Unified content table sample:');
const unifiedContent = db.prepare(`
  SELECT id, title, category_id, processing_status, visibility, status, display_pages
  FROM unified_content
  LIMIT 10
`).all();
console.log(unifiedContent);

// Check the exact query from the API
console.log('\n3. Running the exact API query:');
const apiQuery = `
  SELECT 
    c.id,
    c.name,
    /* slug column may not exist in all schemas; omit */
    c.parent_id as parentId,
    c.icon,
    c.color,
    c.description,
    c.is_for_products as isForProducts,
    c.is_for_services as isForServices,
    c.is_for_ai_apps as isForAiApps,
    c.display_order as displayOrder,
    COUNT(uc.id) as productCount
  FROM categories c
  LEFT JOIN unified_content uc ON c.id = uc.category_id
    AND uc.processing_status = 'completed'
    AND uc.visibility = 'public'
    AND uc.status = 'active'
    AND (uc.display_pages LIKE '%products%' OR uc.display_pages LIKE '%all%')
  WHERE c.parent_id IS NULL
  GROUP BY c.id, c.name, c.slug, c.parent_id, c.icon, c.color, c.description, c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
  HAVING COUNT(uc.id) > 0
  ORDER BY c.display_order ASC, c.name ASC
`;

const apiResult = db.prepare(apiQuery).all();
console.log('API Query Result:', apiResult);

// Check if there are any unified_content records that match the criteria
console.log('\n4. Checking unified_content matching criteria:');
const matchingContent = db.prepare(`
  SELECT id, title, category_id, processing_status, visibility, status, display_pages
  FROM unified_content
  WHERE processing_status = 'completed'
    AND visibility = 'public'
    AND status = 'active'
    AND (display_pages LIKE '%products%' OR display_pages LIKE '%all%')
`).all();
console.log('Matching unified_content records:', matchingContent);

// Check what display_pages values exist
console.log('\n5. All display_pages values:');
const displayPages = db.prepare(`
  SELECT DISTINCT display_pages, COUNT(*) as count
  FROM unified_content
  GROUP BY display_pages
`).all();
console.log(displayPages);

db.close();