const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== CHECKING CATEGORIES AND CONTENT TYPES ===\n');

// Check all items with their categories and content_types
db.all(`
  SELECT title, category, content_type, status
  FROM unified_content 
  ORDER BY content_type, title
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`Found ${rows.length} total items:`);
    rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.title}:`);
      console.log(`   Category: "${row.category}"`);
      console.log(`   Content Type: "${row.content_type}"`);
      console.log(`   Status: "${row.status}"`);
      console.log('');
    });
  }
  
  // Check what would match the services filter
  console.log('\n=== ITEMS MATCHING SERVICES FILTER ===');
  db.all(`
    SELECT title, category, content_type
    FROM unified_content 
    WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service')
    AND status = 'active'
    ORDER BY created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`Found ${rows.length} items matching services filter:`);
      rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.title} (category: "${row.category}", content_type: "${row.content_type}")`);
      });
    }
    
    // Check what would match the apps filter
    console.log('\n=== ITEMS MATCHING APPS FILTER ===');
    db.all(`
      SELECT title, category, content_type
      FROM unified_content 
      WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app')
      AND status = 'active'
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(`Found ${rows.length} items matching apps filter:`);
        rows.forEach((row, i) => {
          console.log(`${i+1}. ${row.title} (category: "${row.category}", content_type: "${row.content_type}")`);
        });
      }
      
      db.close();
    });
  });
});