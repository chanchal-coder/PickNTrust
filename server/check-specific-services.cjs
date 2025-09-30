const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== CHECKING SPECIFIC SERVICES WITH DISCOUNT DATA ===\n');

// Check for Web Design Service and AI Content Generator specifically
db.all(`
  SELECT title, price, original_price, discount, currency, pricing_type, 
         monthly_price, yearly_price, is_free, price_description, content_type
  FROM unified_content 
  WHERE title IN ('Web Design Service', 'AI Content Generator', 'Premium Cloud Storage', 'AI Photo Editor Pro')
  ORDER BY title
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`Found ${rows.length} specific services/apps:`);
    rows.forEach((row, i) => {
      console.log(`\n${i+1}. ${row.title} (${row.content_type}):`);
      console.log(`   Price: ${row.price} ${row.currency}`);
      console.log(`   Original Price: ${row.original_price} ${row.currency}`);
      console.log(`   Discount: ${row.discount}%`);
      console.log(`   Pricing Type: ${row.pricing_type}`);
      console.log(`   Monthly Price: ${row.monthly_price}`);
      console.log(`   Yearly Price: ${row.yearly_price}`);
      console.log(`   Is Free: ${row.is_free}`);
      console.log(`   Price Description: ${row.price_description}`);
    });
  }
  
  // Also check all services and apps
  console.log('\n\n=== ALL SERVICES AND APPS ===');
  db.all(`
    SELECT title, price, original_price, discount, currency, content_type
    FROM unified_content 
    WHERE content_type IN ('service', 'app')
    AND status = 'active'
    ORDER BY content_type, title
  `, (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`\nFound ${rows.length} total services and apps:`);
      rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.title} (${row.content_type}): ${row.price} ${row.currency}, Original: ${row.original_price}, Discount: ${row.discount}%`);
      });
    }
    
    db.close();
  });
});