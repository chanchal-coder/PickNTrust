// Fix Specific Product Prices
// Manually set the correct original prices for products 29 and 30

const Database = require('better-sqlite3');

console.log('🔧 FIXING SPECIFIC PRODUCT PRICES');
console.log('=' .repeat(50));

function fixSpecificPrices() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\nStats Fixing specific product prices...');
    
    // Product 30: Coffee Mug - should be ₹196 original price
    console.log('\n1. Fixing Product ID 30 (Coffee Mug):');
    const updateProduct30 = db.prepare(`
      UPDATE loot_box_products 
      SET original_price = ?, updated_at = ?
      WHERE id = 30
    `).run('₹196', Math.floor(Date.now() / 1000));
    
    if (updateProduct30.changes > 0) {
      console.log('   Success Updated original_price to "₹196"');
    } else {
      console.log('   Error Failed to update product 30');
    }
    
    // Product 29: Mini Bag Sealer - should be ₹399 original price
    console.log('\n2. Fixing Product ID 29 (Mini Bag Sealer):');
    const updateProduct29 = db.prepare(`
      UPDATE loot_box_products 
      SET original_price = ?, updated_at = ?
      WHERE id = 29
    `).run('₹399', Math.floor(Date.now() / 1000));
    
    if (updateProduct29.changes > 0) {
      console.log('   Success Updated original_price to "₹399"');
    } else {
      console.log('   Error Failed to update product 29');
    }
    
    console.log('\nTarget VERIFICATION:');
    console.log('=' .repeat(50));
    
    // Verify the fixes
    const verifyProducts = db.prepare(`
      SELECT id, name, price, original_price 
      FROM loot_box_products 
      WHERE id IN (29, 30)
      ORDER BY id DESC
    `).all();
    
    verifyProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. Product ID: ${product.id}`);
      console.log(`   Name: ${product.name.substring(0, 50)}...`);
      console.log(`   Current Price: "${product.price}"`);
      console.log(`   Original Price: "${product.original_price}"`);
      
      // Validate format
      const currentFormatted = product.price && product.price.startsWith('₹');
      const originalFormatted = product.original_price && product.original_price.startsWith('₹');
      
      console.log(`   Current Format: ${currentFormatted ? 'Success CORRECT' : 'Error WRONG'}`);
      console.log(`   Original Format: ${originalFormatted ? 'Success CORRECT' : 'Error WRONG'}`);
      
      if (currentFormatted && originalFormatted) {
        // Validate price relationship
        const currentNum = parseFloat(product.price.replace(/[^\d.-]/g, ''));
        const originalNum = parseFloat(product.original_price.replace(/[^\d.-]/g, ''));
        
        if (currentNum < originalNum) {
          console.log(`   Success Price relationship correct: ${currentNum} < ${originalNum}`);
          const discount = originalNum - currentNum;
          const discountPercent = Math.round((discount / originalNum) * 100);
          console.log(`   Price Discount: ₹${discount} (${discountPercent}% off)`);
        } else {
          console.log(`   Error Price relationship wrong: ${currentNum} >= ${originalNum}`);
        }
      }
    });
    
    console.log('\n📈 FINAL STATUS:');
    console.log('=' .repeat(50));
    
    const allCorrect = verifyProducts.every(p => {
      const currentFormatted = p.price && p.price.startsWith('₹');
      const originalFormatted = p.original_price && p.original_price.startsWith('₹');
      const currentNum = parseFloat(p.price.replace(/[^\d.-]/g, ''));
      const originalNum = parseFloat(p.original_price.replace(/[^\d.-]/g, ''));
      return currentFormatted && originalFormatted && currentNum < originalNum;
    });
    
    if (allCorrect) {
      console.log('\nCelebration ALL PRICES CORRECTLY FIXED!');
      console.log('   Success Product 29: ₹87 (sale) < ₹399 (regular)');
      console.log('   Success Product 30: ₹98 (sale) < ₹196 (regular)');
      console.log('   Success Both products ready for frontend display');
    } else {
      console.log('\nWarning SOME ISSUES REMAIN');
      console.log('   Please check the verification results above');
    }
    
    db.close();
    
  } catch (error) {
    console.error('Error Error fixing specific prices:', error.message);
  }
}

// Run the fix
fixSpecificPrices();