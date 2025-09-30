const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== SERVICES DATA ===');
db.all(`
  SELECT id, title, price, original_price, discount, currency, pricing_type, monthly_price, yearly_price, is_free, price_description, custom_pricing_details
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
  
  console.log('\n=== APPS DATA ===');
  db.all(`
    SELECT id, title, price, original_price, discount, currency, pricing_type, monthly_price, yearly_price, is_free, price_description, custom_pricing_details
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