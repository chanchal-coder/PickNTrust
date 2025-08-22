const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🧪 Testing enhanced service pricing functionality...');

try {
  // Connect to database
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log('✅ Connected to database');

  // Test 1: Check current table structure
  console.log('\n📋 Current products table structure:');
  const tableInfo = sqlite.prepare(`PRAGMA table_info(products)`).all();
  const columns = tableInfo.map(col => ({ name: col.name, type: col.type, default: col.dflt_value }));
  
  console.table(columns.filter(col => 
    col.name.includes('price') || 
    col.name.includes('service') || 
    col.name.includes('free') ||
    col.name === 'pricing_type'
  ));

  // Test 2: Create test services with different pricing models
  console.log('\n🔧 Creating test services with different pricing models...');
  
  // Free service
  sqlite.prepare(`
    INSERT OR REPLACE INTO products (
      name, description, price, category, is_service, 
      pricing_type, is_free, price_description, 
      image_url, affiliate_url, rating, review_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Free Website Analysis', 
    'Get a free analysis of your website performance', 
    '0', 
    'Web Services', 
    1, 
    'free', 
    1, 
    'Completely free - no hidden costs',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    'https://example.com/free-analysis',
    4.8,
    150,
    Date.now()
  );

  // Monthly subscription service
  sqlite.prepare(`
    INSERT OR REPLACE INTO products (
      name, description, price, category, is_service, 
      pricing_type, monthly_price, price_description,
      image_url, affiliate_url, rating, review_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Premium SEO Tools', 
    'Advanced SEO monitoring and optimization tools', 
    '29', 
    'Software & Apps', 
    1, 
    'monthly', 
    '29', 
    'Billed monthly, cancel anytime',
    'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400',
    'https://example.com/seo-tools',
    4.6,
    89,
    Date.now()
  );

  // Yearly subscription with discount
  sqlite.prepare(`
    INSERT OR REPLACE INTO products (
      name, description, price, category, is_service, 
      pricing_type, monthly_price, yearly_price, price_description,
      image_url, affiliate_url, rating, review_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Cloud Storage Pro', 
    'Unlimited cloud storage with advanced features', 
    '120', 
    'Cloud Services', 
    1, 
    'yearly', 
    '12', 
    '120', 
    'Save 20% with yearly billing',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
    'https://example.com/cloud-storage',
    4.9,
    234,
    Date.now()
  );

  // One-time service
  sqlite.prepare(`
    INSERT OR REPLACE INTO products (
      name, description, price, category, is_service, 
      pricing_type, price_description,
      image_url, affiliate_url, rating, review_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Website Design Package', 
    'Complete website design and development', 
    '1500', 
    'Design Services', 
    1, 
    'one-time', 
    'One-time payment, includes 3 revisions',
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400',
    'https://example.com/web-design',
    4.7,
    45,
    Date.now()
  );

  // Custom pricing service
  sqlite.prepare(`
    INSERT OR REPLACE INTO products (
      name, description, price, category, is_service, 
      pricing_type, price_description,
      image_url, affiliate_url, rating, review_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Enterprise Consulting', 
    'Custom enterprise solutions and consulting', 
    '0', 
    'Consulting', 
    1, 
    'custom', 
    'Contact us for custom pricing based on your needs',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    'https://example.com/consulting',
    5.0,
    12,
    Date.now()
  );

  console.log('✅ Test services created');

  // Test 3: Query services by pricing type
  console.log('\n🔍 Testing service pricing queries...');

  const freeServices = sqlite.prepare(`
    SELECT name, pricing_type, is_free, price_description 
    FROM products 
    WHERE is_service = 1 AND is_free = 1
  `).all();

  const monthlyServices = sqlite.prepare(`
    SELECT name, pricing_type, monthly_price, price_description 
    FROM products 
    WHERE is_service = 1 AND pricing_type = 'monthly'
  `).all();

  const yearlyServices = sqlite.prepare(`
    SELECT name, pricing_type, monthly_price, yearly_price, price_description 
    FROM products 
    WHERE is_service = 1 AND pricing_type = 'yearly'
  `).all();

  console.log('\n🆓 Free Services:');
  console.table(freeServices);

  console.log('\n📅 Monthly Services:');
  console.table(monthlyServices);

  console.log('\n📆 Yearly Services:');
  console.table(yearlyServices);

  // Test 4: All services overview
  console.log('\n📊 All Services Overview:');
  const allServices = sqlite.prepare(`
    SELECT 
      name, 
      pricing_type, 
      price, 
      monthly_price, 
      yearly_price, 
      is_free, 
      price_description 
    FROM products 
    WHERE is_service = 1
    ORDER BY id DESC
    LIMIT 10
  `).all();

  console.table(allServices);

  // Test 5: Pricing statistics
  console.log('\n📈 Service Pricing Statistics:');
  const stats = sqlite.prepare(`
    SELECT 
      pricing_type,
      COUNT(*) as count,
      AVG(CAST(price as REAL)) as avg_price
    FROM products 
    WHERE is_service = 1 
    GROUP BY pricing_type
  `).all();

  console.table(stats);

  sqlite.close();
  console.log('\n🎉 Enhanced service pricing test completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
