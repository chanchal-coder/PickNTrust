const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== UNIFIED_CONTENT TABLE SCHEMA ===');
db.all("PRAGMA table_info(unified_content)", (err, rows) => {
  if (err) {
    console.error('Schema error:', err);
  } else {
    console.log('Table columns:');
    rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`);
    });
  }
  
  console.log('\n=== SAMPLE SERVICES DATA ===');
  db.all(`
    SELECT *
    FROM unified_content 
    WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service')
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `, (err, rows) => {
    if (err) {
      console.error('Services error:', err);
    } else {
      console.log('Services found:', rows.length);
      if (rows.length > 0) {
        console.log('Sample service:', JSON.stringify(rows[0], null, 2));
      }
    }
    
    console.log('\n=== SAMPLE APPS DATA ===');
    db.all(`
      SELECT *
      FROM unified_content 
      WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app')
      AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, (err, rows) => {
      if (err) {
        console.error('Apps error:', err);
      } else {
        console.log('Apps found:', rows.length);
        if (rows.length > 0) {
          console.log('Sample app:', JSON.stringify(rows[0], null, 2));
        }
      }
      db.close();
    });
  });
});