const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');

  console.log('Checking database schema...\n');
  
  // Get table schema
  const schemaQuery = `PRAGMA table_info(unified_content)`;
  const columns = db.prepare(schemaQuery).all();
  console.log('Available columns:');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });

  console.log('\nChecking for products with original price data...\n');

  const query = `
    SELECT id, title, price, original_price, pricing_type, monthly_price, yearly_price 
    FROM unified_content 
    WHERE original_price IS NOT NULL AND original_price != '' AND original_price != '0'
    LIMIT 10
  `;

  const products = db.prepare(query).all();
  console.log('Products with original_price:', products.length);

  if (products.length > 0) {
    products.forEach(p => {
      console.log(`ID: ${p.id}, Title: ${p.title}, Price: ${p.price}, Original: ${p.original_price}`);
    });
  } else {
    console.log('No products found with original_price data.');
    
    // Check all products to see the data structure
    const allQuery = `SELECT id, title, price, original_price LIMIT 5`;
    const allProducts = db.prepare(allQuery).all();
    console.log('\nSample of all products:');
    allProducts.forEach(p => {
      console.log(`ID: ${p.id}, Price: ${p.price}, Original: ${p.original_price}`);
    });
  }

  db.close();
} catch (error) {
  console.error('Error:', error.message);
}