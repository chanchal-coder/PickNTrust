const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Refresh Renaming telegram_products to amazon_products...');

try {
  // Check if telegram_products table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='telegram_products'
  `).get();
  
  if (!tableExists) {
    console.log('Warning telegram_products table does not exist, skipping rename...');
    process.exit(0);
  }
  
  // Check if amazon_products already exists
  const amazonExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='amazon_products'
  `).get();
  
  if (amazonExists) {
    console.log('Warning amazon_products table already exists!');
    
    // Show data in both tables
    const telegramCount = db.prepare('SELECT COUNT(*) as count FROM telegram_products').get();
    const amazonCount = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get();
    
    console.log(`Stats telegram_products: ${telegramCount.count} records`);
    console.log(`Stats amazon_products: ${amazonCount.count} records`);
    
    if (telegramCount.count > 0 && amazonCount.count === 0) {
      console.log('Refresh Migrating data from telegram_products to amazon_products...');
      
      // Copy data from telegram_products to amazon_products
      db.exec(`
        INSERT INTO amazon_products 
        SELECT * FROM telegram_products
      `);
      
      const newCount = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get();
      console.log(`Success Migrated ${newCount.count} records to amazon_products`);
      
      // Drop telegram_products table
      db.exec('DROP TABLE telegram_products');
      console.log('Success Dropped telegram_products table');
    } else {
      console.log('ℹ️ No migration needed');
    }
  } else {
    // Rename telegram_products to amazon_products
    console.log('Refresh Renaming telegram_products to amazon_products...');
    
    db.exec('ALTER TABLE telegram_products RENAME TO amazon_products');
    console.log('Success Successfully renamed telegram_products to amazon_products');
  }
  
  // Update any indexes that reference the old table name
  console.log('Refresh Updating indexes...');
  
  // Get all indexes for the amazon_products table
  const indexes = db.prepare(`
    SELECT name, sql FROM sqlite_master 
    WHERE type='index' AND tbl_name='amazon_products'
  `).all();
  
  console.log(`Stats Found ${indexes.length} indexes for amazon_products table`);
  
  indexes.forEach(index => {
    if (index.name && index.name.includes('telegram')) {
      const newIndexName = index.name.replace('telegram', 'amazon');
      console.log(`Refresh Renaming index: ${index.name} -> ${newIndexName}`);
      
      try {
        // Drop old index and create new one
        db.exec(`DROP INDEX IF EXISTS ${index.name}`);
        
        if (index.sql) {
          const newIndexSql = index.sql
            .replace(index.name, newIndexName)
            .replace('telegram_products', 'amazon_products');
          
          db.exec(newIndexSql);
          console.log(`Success Created new index: ${newIndexName}`);
        }
      } catch (error) {
        console.log(`Warning Could not rename index ${index.name}: ${error.message}`);
      }
    }
  });
  
  // Verify the rename was successful
  console.log('\nSearch Verifying table rename...');
  
  const amazonTable = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='amazon_products'
  `).get();
  
  const telegramTable = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='telegram_products'
  `).get();
  
  if (amazonTable && !telegramTable) {
    console.log('Success Table successfully renamed to amazon_products');
    
    // Show table structure
    const tableInfo = db.prepare('PRAGMA table_info(amazon_products)').all();
    console.log('\n📋 amazon_products table structure:');
    tableInfo.forEach(col => {
      console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // Show current data count
    const count = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get();
    console.log(`\nStats Current amazon_products count: ${count.count}`);
    
    if (count.count > 0) {
      const sample = db.prepare('SELECT id, name, category, price, currency FROM amazon_products LIMIT 3').all();
      console.log('\n📋 Sample Amazon products:');
      sample.forEach(product => {
        console.log(`   ${product.id}. ${product.name} - ${product.currency} ${product.price} (${product.category})`);
      });
    }
  } else {
    console.log('Error Table rename verification failed');
    if (telegramTable) console.log('   - telegram_products still exists');
    if (!amazonTable) console.log('   - amazon_products does not exist');
  }
  
  console.log('\nSuccess Table rename operation completed!');
  console.log('\nTarget Next steps:');
  console.log('   1. Update backend code to use amazon_products');
  console.log('   2. Update API endpoints and queries');
  console.log('   3. Update frontend references');
  console.log('   4. Test Prime Picks page functionality');
  
} catch (error) {
  console.error('Error Error renaming table:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}