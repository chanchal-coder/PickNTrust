const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== CHECKING SERVICES API DATA ===');
db.all(`
  SELECT id, title, price, original_price, discount, currency, pricing_type, monthly_price, yearly_price, is_free, price_description, category, content_type
  FROM unified_content 
  WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service')
  AND status = 'active'
  ORDER BY created_at DESC
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Services found:', rows.length);
    rows.forEach((row, i) => {
      console.log(`Service ${i+1}:`);
      console.log('  Title:', row.title);
      console.log('  Price:', row.price);
      console.log('  Original Price:', row.original_price);
      console.log('  Discount:', row.discount);
      console.log('  Currency:', row.currency);
      console.log('  Pricing Type:', row.pricing_type);
      console.log('  Category:', row.category);
      console.log('  Content Type:', row.content_type);
      console.log('---');
    });
  }
  
  console.log('\n=== CHECKING APPS API DATA ===');
  db.all(`
    SELECT id, title, price, original_price, discount, currency, pricing_type, monthly_price, yearly_price, is_free, price_description, category, content_type
    FROM unified_content 
    WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app')
    AND status = 'active'
    ORDER BY created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Apps found:', rows.length);
      rows.forEach((row, i) => {
        console.log(`App ${i+1}:`);
        console.log('  Title:', row.title);
        console.log('  Price:', row.price);
        console.log('  Original Price:', row.original_price);
        console.log('  Discount:', row.discount);
        console.log('  Currency:', row.currency);
        console.log('  Pricing Type:', row.pricing_type);
        console.log('  Category:', row.category);
        console.log('  Content Type:', row.content_type);
        console.log('---');
      });
    }
    
    console.log('\n=== CHECKING ALL PRODUCTS WITH PRICING ===');
    db.all(`
      SELECT id, title, price, original_price, discount, currency, pricing_type, category, content_type
      FROM unified_content 
      WHERE status = 'active'
      AND (price IS NOT NULL OR original_price IS NOT NULL)
      ORDER BY created_at DESC
      LIMIT 10
    `, (err, rows) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('Products with pricing found:', rows.length);
        rows.forEach((row, i) => {
          console.log(`Product ${i+1}:`);
          console.log('  Title:', row.title);
          console.log('  Price:', row.price);
          console.log('  Original Price:', row.original_price);
          console.log('  Discount:', row.discount);
          console.log('  Currency:', row.currency);
          console.log('  Pricing Type:', row.pricing_type);
          console.log('  Category:', row.category);
          console.log('  Content Type:', row.content_type);
          console.log('---');
        });
      }
      db.close();
    });
  });
});