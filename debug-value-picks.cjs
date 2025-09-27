const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== DEBUGGING VALUE-PICKS QUERY ===\n');
  
  // First, check what products exist for value-picks
  const allValuePicks = db.prepare(`
    SELECT id, title, display_pages, processing_status, visibility, status 
    FROM unified_content 
    WHERE display_pages LIKE '%value-picks%'
  `).all();
  
  console.log('All value-picks products in database:');
  console.log(allValuePicks);
  
  // Now test the exact query used by the backend
  const backendQuery = `
    SELECT * FROM unified_content 
    WHERE (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
    AND (visibility = 'public' OR visibility IS NULL)
    AND (status = 'published' OR status = 'active' OR status IS NULL)
    AND (display_pages LIKE '%' || ? || '%' OR display_pages = ?)
    ORDER BY created_at DESC LIMIT 50 OFFSET 0
  `;
  
  const backendResults = db.prepare(backendQuery).all('value-picks', 'value-picks');
  
  console.log('\nBackend query results:');
  console.log('Found', backendResults.length, 'products');
  console.log(backendResults.map(p => ({
    id: p.id, 
    title: p.title, 
    display_pages: p.display_pages,
    processing_status: p.processing_status,
    visibility: p.visibility,
    status: p.status
  })));
  
  db.close();
  
} catch (error) {
  console.error('Error:', error.message);
}