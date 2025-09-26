const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== UPDATING EXISTING RECORDS WITH PRICING DEFAULTS ===');

// Update existing records to set appropriate pricing_type based on their price
db.run(`
  UPDATE unified_content 
  SET pricing_type = CASE 
    WHEN price = '0' OR price IS NULL OR price = '' THEN 'free'
    ELSE 'one-time'
  END,
  is_free = CASE 
    WHEN price = '0' OR price IS NULL OR price = '' THEN 1
    ELSE 0
  END
  WHERE pricing_type IS NULL OR pricing_type = 'one-time'
`, (err) => {
  if (err) {
    console.error('Error updating records:', err);
  } else {
    console.log('✓ Updated existing records with pricing defaults');
  }
  
  // Check the updated records
  console.log('\n=== CHECKING UPDATED SERVICES ===');
  db.all(`
    SELECT id, title, price, pricing_type, is_free, monthly_price, yearly_price, price_description
    FROM unified_content 
    WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service')
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 3
  `, (err, rows) => {
    if (err) {
      console.error('Services error:', err);
    } else {
      console.log('Services found:', rows.length);
      rows.forEach((row, i) => {
        console.log(`Service ${i+1}:`, JSON.stringify(row, null, 2));
      });
    }
    
    console.log('\n=== CHECKING UPDATED APPS ===');
    db.all(`
      SELECT id, title, price, pricing_type, is_free, monthly_price, yearly_price, price_description
      FROM unified_content 
      WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app')
      AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 3
    `, (err, rows) => {
      if (err) {
        console.error('Apps error:', err);
      } else {
        console.log('Apps found:', rows.length);
        rows.forEach((row, i) => {
          console.log(`App ${i+1}:`, JSON.stringify(row, null, 2));
        });
      }
      db.close();
    });
  });
});