const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('Refresh Running complete service migration...');
console.log('Database path:', dbPath);

try {
  // Connect to database
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log('Success Connected to database');

  // First, check current table structure
  console.log('📋 Checking current products table structure...');
  const tableInfo = sqlite.prepare(`PRAGMA table_info(products)`).all();
  const existingColumns = tableInfo.map(col => col.name);
  
  console.log('Current columns:', existingColumns);

  // Helper function to add column if it doesn't exist
  const addColumnIfNotExists = (columnName, columnDefinition) => {
    if (!existingColumns.includes(columnName)) {
      console.log(`Blog Adding ${columnName} column...`);
      sqlite.exec(`ALTER TABLE products ADD COLUMN ${columnName} ${columnDefinition};`);
    } else {
      console.log(`Success Column ${columnName} already exists`);
    }
  };

  // Add service-related columns first
  addColumnIfNotExists('is_service', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('custom_fields', 'TEXT');

  // Add enhanced pricing fields for services
  addColumnIfNotExists('pricing_type', 'TEXT');
  addColumnIfNotExists('monthly_price', 'TEXT');
  addColumnIfNotExists('yearly_price', 'TEXT');
  addColumnIfNotExists('is_free', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('price_description', 'TEXT');

  // Update existing products with default values
  console.log('Refresh Setting default values for existing products...');
  
  // Set default service values
  sqlite.exec(`
    UPDATE products 
    SET is_service = 0 
    WHERE is_service IS NULL;
  `);

  // Set default pricing type for any existing services
  sqlite.exec(`
    UPDATE products 
    SET pricing_type = 'one-time', is_free = 0 
    WHERE is_service = 1 AND pricing_type IS NULL;
  `);

  console.log('Success Service migration completed successfully!');

  // Verify the changes
  console.log('📋 Verifying table structure...');
  const updatedTableInfo = sqlite.prepare(`PRAGMA table_info(products)`).all();
  const newColumns = updatedTableInfo.map(col => col.name);
  
  console.log('Updated columns:', newColumns);

  // Check for any existing services
  const serviceCount = sqlite.prepare(`
    SELECT COUNT(*) as count FROM products WHERE is_service = 1
  `).get();

  console.log(`Stats Current services in database: ${serviceCount.count}`);

  // Show sample data structure
  const sampleProduct = sqlite.prepare(`
    SELECT id, name, price, pricing_type, monthly_price, yearly_price, is_free, is_service 
    FROM products 
    LIMIT 1
  `).get();

  if (sampleProduct) {
    console.log('📋 Sample product structure:');
    console.table([sampleProduct]);
  }

  sqlite.close();
  console.log('Celebration Complete service migration finished successfully!');

} catch (error) {
  console.error('Error Migration failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
