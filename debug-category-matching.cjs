const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Debugging category matching...\n');

// Check categories
console.log('1. Categories in categories table:');
const categories = db.prepare(`
  SELECT id, name, slug, is_for_products, is_for_services, is_for_ai_apps
  FROM categories
  WHERE parent_id IS NULL
`).all();
console.table(categories);

// Check category values in unified_content
console.log('\n2. Category values in unified_content:');
const categoryValues = db.prepare(`
  SELECT DISTINCT category, COUNT(*) as count
  FROM unified_content
  WHERE category IS NOT NULL
  GROUP BY category
`).all();
console.table(categoryValues);

// Check matching records
console.log('\n3. Matching records between tables:');
const matchingRecords = db.prepare(`
  SELECT 
    c.name as category_name,
    COUNT(uc.id) as product_count,
    COUNT(CASE WHEN uc.processing_status = 'completed' AND uc.visibility = 'public' AND uc.status = 'active' THEN 1 END) as active_count
  FROM categories c
  LEFT JOIN unified_content uc ON uc.category = c.name
  WHERE c.parent_id IS NULL
  GROUP BY c.id, c.name
`).all();
console.table(matchingRecords);

// Check specific unified_content records with their status
console.log('\n4. Unified content records with status:');
const contentStatus = db.prepare(`
  SELECT id, title, category, processing_status, visibility, status, is_service, is_ai_app
  FROM unified_content
  LIMIT 10
`).all();
console.table(contentStatus);

db.close();