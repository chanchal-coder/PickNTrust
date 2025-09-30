const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== ADDING SAMPLE DISCOUNT DATA ===');

// Update the existing service with original price and discount
console.log('\n🔧 UPDATING WEB DESIGN SERVICE WITH DISCOUNT:');
const updateService = db.prepare(`
  UPDATE unified_content 
  SET original_price = ?, discount = ?
  WHERE title = 'Web Design Service'
`);

const serviceResult = updateService.run('399.99', 25); // 25% discount from 399.99 to 299.99
console.log('Service update result:', serviceResult);

// Update the existing app with original price and discount
console.log('\n🔧 UPDATING AI CONTENT GENERATOR WITH DISCOUNT:');
const updateApp = db.prepare(`
  UPDATE unified_content 
  SET original_price = ?, discount = ?
  WHERE title = 'AI Content Generator'
`);

const appResult = updateApp.run('29.99', 33); // 33% discount from 29.99 to 19.99
console.log('App update result:', appResult);

// Add a new service with monthly pricing and discount
console.log('\n🔧 ADDING NEW SERVICE WITH MONTHLY PRICING:');
const insertService = db.prepare(`
  INSERT INTO unified_content (
    title, description, price, original_price, discount, currency, 
    pricing_type, monthly_price, yearly_price, is_free, price_description,
    image_url, affiliate_url, content_type, category, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const newServiceResult = insertService.run(
  'Premium Cloud Storage',
  'Secure cloud storage with advanced features and unlimited bandwidth',
  '9.99',      // current monthly price
  '14.99',     // original monthly price
  33,          // 33% discount
  'USD',
  'monthly',   // monthly subscription
  '9.99',      // monthly price
  '99.99',     // yearly price (with discount)
  0,           // not free
  'Monthly subscription with 33% discount',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80',
  'https://example.com/cloud-storage',
  'service',
  'Technology Service',
  'active',
  Date.now()
);
console.log('New service insert result:', newServiceResult);

// Add a new app with yearly pricing and discount
console.log('\n🔧 ADDING NEW APP WITH YEARLY PRICING:');
const insertApp = db.prepare(`
  INSERT INTO unified_content (
    title, description, price, original_price, discount, currency, 
    pricing_type, monthly_price, yearly_price, is_free, price_description,
    image_url, affiliate_url, content_type, category, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const newAppResult = insertApp.run(
  'AI Photo Editor Pro',
  'Professional AI-powered photo editing with advanced filters and effects',
  '79.99',     // current yearly price
  '119.99',    // original yearly price
  33,          // 33% discount
  'USD',
  'yearly',    // yearly subscription
  '9.99',      // monthly price equivalent
  '79.99',     // yearly price
  0,           // not free
  'Annual subscription with 33% discount',
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&q=80',
  'https://example.com/ai-photo-editor',
  'app',
  'AI Photo App',
  'active',
  Date.now()
);
console.log('New app insert result:', newAppResult);

// Verify the updates
console.log('\n🔍 VERIFYING UPDATED DATA:');
db.all(`
  SELECT title, price, original_price, discount, currency, pricing_type, monthly_price, yearly_price, is_free, price_description
  FROM unified_content 
  WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service' OR 
         category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app')
  AND status = 'active'
  ORDER BY created_at DESC
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`Found ${rows.length} services and apps with pricing data:`);
    rows.forEach((row, i) => {
      console.log(`\n${i+1}. ${row.title}:`);
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
  
  db.close();
  console.log('\n✅ SAMPLE DISCOUNT DATA ADDED SUCCESSFULLY!');
  console.log('💡 Now services and apps should show original prices and discounts');
});