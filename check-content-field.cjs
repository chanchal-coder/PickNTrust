const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking content field for recent Telegram products...\n');

// Get recent Telegram products with their actual fields
const recentProducts = db.prepare(`
  SELECT 
    id, 
    title, 
    price, 
    original_price, 
    discount,
    image_url,
    source_type,
    created_at
  FROM unified_content 
  WHERE source_type = 'telegram'
  ORDER BY id DESC 
  LIMIT 10
`).all();

console.log(`Found ${recentProducts.length} recent Telegram products:\n`);

recentProducts.forEach(product => {
  console.log(`📦 Product ID: ${product.id}`);
  console.log(`   Title: ${product.title}`);
  console.log(`   Price: ${product.price || 'NULL'}`);
  console.log(`   Original Price: ${product.original_price || 'NULL'}`);
  console.log(`   Discount: ${product.discount || 'NULL'}`);
  console.log(`   Image URL: ${product.image_url ? 'Present' : 'NULL'}`);
  console.log(`   Created: ${product.created_at}`);
  console.log('   ---');
});

// Check specific BAJAJ products
console.log('\n🎯 Checking BAJAJ products specifically:');
const bajajProducts = db.prepare(`
  SELECT 
    id, 
    title, 
    price,
    original_price,
    discount,
    image_url
  FROM unified_content 
  WHERE title LIKE '%BAJAJ%' OR title LIKE '%Bajaj%'
  ORDER BY id DESC
`).all();

bajajProducts.forEach(product => {
  console.log(`📦 Product ID: ${product.id}`);
  console.log(`   Title: ${product.title}`);
  console.log(`   Price: ${product.price || 'NULL'}`);
  console.log(`   Original Price: ${product.original_price || 'NULL'}`);
  console.log(`   Discount: ${product.discount || 'NULL'}`);
  console.log(`   Image URL: ${product.image_url ? 'Present' : 'NULL'}`);
  console.log('   ---');
});

db.close();