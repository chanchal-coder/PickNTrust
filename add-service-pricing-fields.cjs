const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('Refresh Adding enhanced service pricing fields...');
console.log('Database path:', dbPath);

try {
  // Connect to database
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log('Success Connected to database');

  // Add the new pricing fields to products table
  console.log('Blog Adding pricingType column...');
  sqlite.exec(`
    ALTER TABLE products 
    ADD COLUMN pricingType TEXT;
  `);

  console.log('Blog Adding monthlyPrice column...');
  sqlite.exec(`
    ALTER TABLE products 
    ADD COLUMN monthlyPrice TEXT;
  `);

  console.log('Blog Adding yearlyPrice column...');
  sqlite.exec(`
    ALTER TABLE products 
    ADD COLUMN yearlyPrice TEXT;
  `);

  console.log('Blog Adding isFree column...');
  sqlite.exec(`
    ALTER TABLE products 
    ADD COLUMN isFree INTEGER DEFAULT 0;
  `);

  console.log('Blog Adding priceDescription column...');
  sqlite.exec(`
    ALTER TABLE products 
    ADD COLUMN priceDescription TEXT;
  `);

  // Update existing services with default pricing type
  console.log('Refresh Updating existing services with default pricing...');
  sqlite.exec(`
    UPDATE products 
    SET pricingType = 'one-time', isFree = 0 
    WHERE isService = 1 AND pricingType IS NULL;
  `);

  console.log('Success Service pricing fields migration completed successfully!');
  console.log('Stats Services now support flexible pricing options');

  // Verify the changes
  const result = sqlite.prepare(`
    SELECT name, price, pricingType, monthlyPrice, yearlyPrice, isFree, priceDescription 
    FROM products 
    WHERE isService = 1
    LIMIT 5
  `).all();

  console.log('📋 Sample services after migration:');
  console.table(result);

  sqlite.close();
  console.log('Celebration Migration completed successfully!');

} catch (error) {
  console.error('Error Migration failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
