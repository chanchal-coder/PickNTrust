const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Refresh Migrating Prime Picks products from products table to amazon_products table...');
  
  // Get all prime-picks products from the main products table
  const primePicksProducts = db.prepare(`
    SELECT * FROM products 
    WHERE display_pages LIKE '%prime-picks%'
  `).all();
  
  console.log(`Products Found ${primePicksProducts.length} Prime Picks products to migrate`);
  
  if (primePicksProducts.length === 0) {
    console.log('Success No products to migrate');
    db.close();
    process.exit(0);
  }
  
  // Prepare insert statement for amazon_products table
  const insertStmt = db.prepare(`
    INSERT INTO amazon_products (
      name, description, price, original_price, currency, image_url, affiliate_url,
      category, rating, review_count, discount, is_featured, source,
      telegram_message_id, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Prepare delete statement for products table
  const deleteStmt = db.prepare('DELETE FROM products WHERE id = ?');
  
  let migrated = 0;
  let errors = 0;
  
  // Begin transaction
  const transaction = db.transaction(() => {
    for (const product of primePicksProducts) {
      try {
        console.log(`📋 Migrating: ${product.name}`);
        
        // Insert into amazon_products
        const result = insertStmt.run(
          product.name,
          product.description,
          product.price,
          product.original_price,
          product.currency || 'INR',
          product.image_url,
          product.affiliate_url,
          product.category,
          product.rating,
          product.review_count,
          product.discount,
          product.is_featured,
          'telegram-prime-picks',
          product.telegram_message_id,
          product.expires_at,
          product.created_at,
          Date.now()
        );
        
        if (result.changes > 0) {
          // Delete from products table
          const deleteResult = deleteStmt.run(product.id);
          if (deleteResult.changes > 0) {
            console.log(`Success Migrated product ID ${product.id} -> amazon_products ID ${result.lastInsertRowid}`);
            migrated++;
          } else {
            console.log(`Error Failed to delete product ID ${product.id} from products table`);
            errors++;
          }
        } else {
          console.log(`Error Failed to insert product ID ${product.id} into amazon_products`);
          errors++;
        }
      } catch (error) {
        console.log(`Error Error migrating product ID ${product.id}: ${error.message}`);
        errors++;
      }
    }
  });
  
  // Execute transaction
  transaction();
  
  console.log(`\nStats Migration Summary:`);
  console.log(`Success Successfully migrated: ${migrated} products`);
  console.log(`Error Errors: ${errors} products`);
  
  // Verify migration
  const amazonCount = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get();
  const remainingProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE display_pages LIKE "%prime-picks%"').get();
  
  console.log(`\nSearch Verification:`);
  console.log(`Products amazon_products table now has: ${amazonCount.count} records`);
  console.log(`Products products table prime-picks remaining: ${remainingProducts.count} records`);
  
  if (amazonCount.count > 0) {
    console.log('\n📋 Sample migrated products:');
    const samples = db.prepare('SELECT id, name, price, original_price FROM amazon_products LIMIT 3').all();
    samples.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.name.substring(0, 40)}..., Price: ${p.price}, Original: ${p.original_price}`);
    });
  }
  
  db.close();
  
  if (migrated > 0) {
    console.log('\nCelebration Migration completed! Prime Picks now uses its dedicated amazon_products table.');
    console.log('Refresh Please restart the server to see the changes.');
  }
  
} catch (error) {
  console.error('Error Migration error:', error.message);
  process.exit(1);
}