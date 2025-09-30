const Database = require('better-sqlite3');
const path = require('path');

console.log('Refresh Adding Currency Support to Database...');
console.log('=' .repeat(50));

try {
  // Connect to database
  const dbPath = path.join(__dirname, 'database.sqlite');
  console.log(`Upload Database path: ${dbPath}`);
  
  const db = new Database(dbPath);
  console.log('Success Connected to database');

  // Check if currency column already exists
  console.log('\nSearch Checking current products table structure...');
  const tableInfo = db.prepare(`PRAGMA table_info(products)`).all();
  const columnNames = tableInfo.map(col => col.name);
  
  const hasCurrency = columnNames.includes('currency');
  console.log(`Currency column exists: ${hasCurrency ? 'Success YES' : 'Error NO'}`);

  // Add currency column to products table if it doesn't exist
  if (!hasCurrency) {
    console.log('\nBlog Adding currency column to products table...');
    db.exec(`
      ALTER TABLE products 
      ADD COLUMN currency TEXT DEFAULT 'INR';
    `);
    console.log('Success Currency column added to products table');
  } else {
    console.log('⏭️ Currency column already exists, skipping...');
  }

  // Check if currency_settings table exists
  console.log('\nSearch Checking for currency_settings table...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);
  
  const hasCurrencySettings = tableNames.includes('currency_settings');
  console.log(`Currency settings table exists: ${hasCurrencySettings ? 'Success YES' : 'Error NO'}`);

  // Create currency_settings table if it doesn't exist
  if (!hasCurrencySettings) {
    console.log('\n🏗️ Creating currency_settings table...');
    db.exec(`
      CREATE TABLE currency_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        default_currency TEXT DEFAULT 'INR',
        enabled_currencies TEXT DEFAULT '["INR","USD","EUR","GBP","JPY","CAD","AUD","SGD","CNY","KRW"]',
        auto_update_rates INTEGER DEFAULT 1,
        last_rate_update INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    console.log('Success Currency settings table created');

    // Insert default currency settings
    console.log('Blog Inserting default currency settings...');
    db.prepare(`
      INSERT INTO currency_settings (default_currency, enabled_currencies, auto_update_rates)
      VALUES (?, ?, ?)
    `).run('INR', '["INR","USD","EUR","GBP","JPY","CAD","AUD","SGD","CNY","KRW"]', 1);
    console.log('Success Default currency settings inserted');
  } else {
    console.log('⏭️ Currency settings table already exists, skipping...');
  }

  // Check if exchange_rates table exists
  const hasExchangeRates = tableNames.includes('exchange_rates');
  console.log(`Exchange rates table exists: ${hasExchangeRates ? 'Success YES' : 'Error NO'}`);

  // Create exchange_rates table if it doesn't exist
  if (!hasExchangeRates) {
    console.log('\n🏗️ Creating exchange_rates table...');
    db.exec(`
      CREATE TABLE exchange_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        rate REAL NOT NULL,
        last_updated INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    console.log('Success Exchange rates table created');

    // Insert default exchange rates (approximate values)
    console.log('Blog Inserting default exchange rates...');
    const defaultRates = [
      ['INR', 'USD', 0.012],
      ['INR', 'EUR', 0.011],
      ['INR', 'GBP', 0.0095],
      ['INR', 'JPY', 1.8],
      ['INR', 'CAD', 0.016],
      ['INR', 'AUD', 0.018],
      ['INR', 'SGD', 0.016],
      ['INR', 'CNY', 0.087],
      ['INR', 'KRW', 16.2],
      // Reverse rates
      ['USD', 'INR', 83.0],
      ['EUR', 'INR', 90.0],
      ['GBP', 'INR', 105.0],
      ['JPY', 'INR', 0.56],
      ['CAD', 'INR', 62.0],
      ['AUD', 'INR', 55.0],
      ['SGD', 'INR', 62.0],
      ['CNY', 'INR', 11.5],
      ['KRW', 'INR', 0.062]
    ];

    const insertRate = db.prepare(`
      INSERT INTO exchange_rates (from_currency, to_currency, rate)
      VALUES (?, ?, ?)
    `);

    for (const [from, to, rate] of defaultRates) {
      insertRate.run(from, to, rate);
    }
    console.log(`Success ${defaultRates.length} default exchange rates inserted`);
  } else {
    console.log('⏭️ Exchange rates table already exists, skipping...');
  }

  // Update existing products to have INR currency if they don't have one
  console.log('\nRefresh Updating existing products with default currency...');
  const updateResult = db.prepare(`
    UPDATE products 
    SET currency = 'INR' 
    WHERE currency IS NULL OR currency = ''
  `).run();
  console.log(`Success Updated ${updateResult.changes} products with default currency`);

  // Verify the changes
  console.log('\nStats Verification:');
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const currencySettingsCount = db.prepare('SELECT COUNT(*) as count FROM currency_settings').get().count;
  const exchangeRatesCount = db.prepare('SELECT COUNT(*) as count FROM exchange_rates').get().count;
  
  console.log(`- Products: ${productCount}`);
  console.log(`- Currency Settings: ${currencySettingsCount}`);
  console.log(`- Exchange Rates: ${exchangeRatesCount}`);

  // Show sample products with currency
  console.log('\n📋 Sample products with currency:');
  const sampleProducts = db.prepare(`
    SELECT id, name, price, currency 
    FROM products 
    LIMIT 3
  `).all();
  
  sampleProducts.forEach(product => {
    console.log(`  - ${product.name}: ${product.currency} ${product.price}`);
  });

  db.close();
  console.log('\nCelebration Currency support successfully added to database!');
  console.log('\nTip Next steps:');
  console.log('1. Update product forms to include currency selection');
  console.log('2. Create currency context for global currency management');
  console.log('3. Update product display components to show currency');
  console.log('4. Add currency selector to header');

} catch (error) {
  console.error('Error Error adding currency support:', error.message);
  console.error(error.stack);
  process.exit(1);
}