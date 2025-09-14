// Fix Malformed Prices in Database
// Update existing products with malformed original prices

const Database = require('better-sqlite3');

console.log('🔧 FIXING MALFORMED PRICES IN DATABASE');
console.log('=' .repeat(50));

function fixMalformedPrices() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\nStats Checking for malformed prices...');
    
    // Find products with malformed original prices
    const malformedProducts = db.prepare(`
      SELECT id, name, price, original_price 
      FROM loot_box_products 
      WHERE original_price LIKE '.%' OR original_price NOT LIKE '₹%'
      ORDER BY id DESC
    `).all();
    
    console.log(`\nSearch Found ${malformedProducts.length} products with malformed prices:`);
    
    if (malformedProducts.length === 0) {
      console.log('   Success No malformed prices found!');
      db.close();
      return;
    }
    
    malformedProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. Product ID: ${product.id}`);
      console.log(`   Name: ${product.name.substring(0, 50)}...`);
      console.log(`   Current Price: "${product.price}"`);
      console.log(`   Original Price: "${product.original_price}" ← MALFORMED`);
      
      // Extract numeric value from malformed price
      let numericValue = null;
      if (product.original_price) {
        const cleaned = product.original_price.replace(/[^0-9.]/g, '');
        numericValue = parseFloat(cleaned);
      }
      
      if (numericValue && numericValue > 0) {
        const fixedPrice = `₹${Math.floor(numericValue)}`;
        console.log(`   Fixed Price: "${fixedPrice}"`);
        
        // Update the database
        const updateResult = db.prepare(`
          UPDATE loot_box_products 
          SET original_price = ?, updated_at = ?
          WHERE id = ?
        `).run(fixedPrice, Math.floor(Date.now() / 1000), product.id);
        
        if (updateResult.changes > 0) {
          console.log(`   Success FIXED: Updated original_price to "${fixedPrice}"`);
        } else {
          console.log(`   Error FAILED: Could not update product ${product.id}`);
        }
      } else {
        console.log(`   Error SKIPPED: Could not extract valid price from "${product.original_price}"`);
      }
    });
    
    console.log('\nTarget VERIFICATION:');
    console.log('=' .repeat(50));
    
    // Verify the fixes
    const verifyProducts = db.prepare(`
      SELECT id, name, price, original_price 
      FROM loot_box_products 
      WHERE id IN (${malformedProducts.map(p => p.id).join(', ')})
      ORDER BY id DESC
    `).all();
    
    let fixedCount = 0;
    verifyProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. Product ID: ${product.id}`);
      console.log(`   Current Price: "${product.price}"`);
      console.log(`   Original Price: "${product.original_price}"`);
      
      const isFixed = product.original_price && product.original_price.startsWith('₹');
      console.log(`   Status: ${isFixed ? 'Success FIXED' : 'Error STILL MALFORMED'}`);
      
      if (isFixed) {
        fixedCount++;
        
        // Validate price relationship
        const currentNum = parseFloat(product.price.replace(/[^\d.-]/g, ''));
        const originalNum = parseFloat(product.original_price.replace(/[^\d.-]/g, ''));
        
        if (currentNum < originalNum) {
          console.log(`   Success Price relationship correct: ${currentNum} < ${originalNum}`);
        } else {
          console.log(`   Warning Price relationship issue: ${currentNum} >= ${originalNum}`);
        }
      }
    });
    
    console.log('\n📈 SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`   Total malformed products found: ${malformedProducts.length}`);
    console.log(`   Successfully fixed: ${fixedCount}`);
    console.log(`   Still need fixing: ${malformedProducts.length - fixedCount}`);
    
    if (fixedCount === malformedProducts.length) {
      console.log('\nCelebration ALL PRICES FIXED SUCCESSFULLY!');
      console.log('   Success All original prices now have proper ₹ formatting');
      console.log('   Success Frontend should now display correct pricing');
    } else {
      console.log('\nWarning SOME PRICES STILL NEED ATTENTION');
      console.log('   Please check the failed updates above');
    }
    
    // Check for any remaining malformed prices
    const remainingMalformed = db.prepare(`
      SELECT COUNT(*) as count 
      FROM loot_box_products 
      WHERE original_price LIKE '.%' OR (original_price IS NOT NULL AND original_price NOT LIKE '₹%')
    `).get();
    
    console.log(`\nSearch Remaining malformed prices: ${remainingMalformed.count}`);
    
    db.close();
    
  } catch (error) {
    console.error('Error Error fixing prices:', error.message);
  }
}

// Run the fix
fixMalformedPrices();