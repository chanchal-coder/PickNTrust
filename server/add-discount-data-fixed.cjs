const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== ADDING SAMPLE DISCOUNT DATA (FIXED) ===');

// Update the existing service with original price and discount
console.log('\n🔧 UPDATING WEB DESIGN SERVICE WITH DISCOUNT:');
const updateService = db.prepare(`
  UPDATE unified_content 
  SET original_price = ?, discount = ?
  WHERE title = 'Web Design Service'
`);

const serviceResult = updateService.run('399.99', 25); // 25% discount from 399.99 to 299.99
console.log('Service update result:', serviceResult.changes, 'rows affected');

// Update the existing app with original price and discount
console.log('\n🔧 UPDATING AI CONTENT GENERATOR WITH DISCOUNT:');
const updateApp = db.prepare(`
  UPDATE unified_content 
  SET original_price = ?, discount = ?
  WHERE title = 'AI Content Generator'
`);

const appResult = updateApp.run('29.99', 33); // 33% discount from 29.99 to 19.99
console.log('App update result:', appResult.changes, 'rows affected');

// Add a new service with monthly pricing and discount (with all required fields)
console.log('\n🔧 ADDING NEW SERVICE WITH MONTHLY PRICING:');
const insertService = db.prepare(`
  INSERT INTO unified_content (
    title, description, price, original_price, discount, currency, 
    pricing_type, monthly_price, yearly_price, is_free, price_description,
    image_url, affiliate_url, content_type, page_type, category, 
    source_type, source_id, affiliate_platform, rating, review_count,
    gender, is_active, is_featured, display_order, display_pages,
    has_timer, timer_duration, timer_start_time, status, source_channel,
    created_at, updated_at, custom_pricing_details
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const newServiceResult = insertService.run(
  'Premium Cloud Storage',                                                    // title
  'Secure cloud storage with advanced features and unlimited bandwidth',     // description
  '9.99',                                                                    // price
  '14.99',                                                                   // original_price
  33,                                                                        // discount
  'USD',                                                                     // currency
  'monthly',                                                                 // pricing_type
  '9.99',                                                                    // monthly_price
  '99.99',                                                                   // yearly_price
  0,                                                                         // is_free
  'Monthly subscription with 33% discount',                                  // price_description
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80',  // image_url
  'https://example.com/cloud-storage',                                       // affiliate_url
  'service',                                                                 // content_type
  'homepage',                                                                // page_type
  'Technology Service',                                                      // category
  'manual',                                                                  // source_type
  'manual-service-1',                                                        // source_id
  'direct',                                                                  // affiliate_platform
  '4.5',                                                                     // rating
  127,                                                                       // review_count
  null,                                                                      // gender
  1,                                                                         // is_active
  1,                                                                         // is_featured
  1,                                                                         // display_order
  'homepage,services',                                                       // display_pages
  0,                                                                         // has_timer
  null,                                                                      // timer_duration
  null,                                                                      // timer_start_time
  'active',                                                                  // status
  'manual',                                                                  // source_channel
  Date.now(),                                                                // created_at
  Date.now(),                                                                // updated_at
  null                                                                       // custom_pricing_details
);
console.log('New service insert result:', newServiceResult.changes, 'rows affected');

// Add a new app with yearly pricing and discount (with all required fields)
console.log('\n🔧 ADDING NEW APP WITH YEARLY PRICING:');
const insertApp = db.prepare(`
  INSERT INTO unified_content (
    title, description, price, original_price, discount, currency, 
    pricing_type, monthly_price, yearly_price, is_free, price_description,
    image_url, affiliate_url, content_type, page_type, category, 
    source_type, source_id, affiliate_platform, rating, review_count,
    gender, is_active, is_featured, display_order, display_pages,
    has_timer, timer_duration, timer_start_time, status, source_channel,
    created_at, updated_at, custom_pricing_details
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const newAppResult = insertApp.run(
  'AI Photo Editor Pro',                                                     // title
  'Professional AI-powered photo editing with advanced filters and effects', // description
  '79.99',                                                                   // price
  '119.99',                                                                  // original_price
  33,                                                                        // discount
  'USD',                                                                     // currency
  'yearly',                                                                  // pricing_type
  '9.99',                                                                    // monthly_price
  '79.99',                                                                   // yearly_price
  0,                                                                         // is_free
  'Annual subscription with 33% discount',                                   // price_description
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&q=80', // image_url
  'https://example.com/ai-photo-editor',                                     // affiliate_url
  'app',                                                                     // content_type
  'homepage',                                                                // page_type
  'AI Photo App',                                                            // category
  'manual',                                                                  // source_type
  'manual-app-1',                                                            // source_id
  'direct',                                                                  // affiliate_platform
  '4.8',                                                                     // rating
  89,                                                                        // review_count
  null,                                                                      // gender
  1,                                                                         // is_active
  1,                                                                         // is_featured
  1,                                                                         // display_order
  'homepage,apps',                                                           // display_pages
  0,                                                                         // has_timer
  null,                                                                      // timer_duration
  null,                                                                      // timer_start_time
  'active',                                                                  // status
  'manual',                                                                  // source_channel
  Date.now(),                                                                // created_at
  Date.now(),                                                                // updated_at
  null                                                                       // custom_pricing_details
);
console.log('New app insert result:', newAppResult.changes, 'rows affected');

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