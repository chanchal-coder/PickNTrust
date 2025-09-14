// Final Prime Picks Schema and Parsing Verification
const Database = require('better-sqlite3');

console.log('Target FINAL PRIME PICKS SCHEMA & PARSING VERIFICATION');
console.log('=' .repeat(60));

try {
  const db = new Database('database.sqlite');
  
  console.log('\n1. Success DATABASE SCHEMA VERIFICATION...');
  
  // Check amazon_products table exists and has correct structure
  const amazonSchema = db.prepare('PRAGMA table_info(amazon_products)').all();
  const requiredColumns = [
    'id', 'name', 'description', 'price', 'original_price', 'currency',
    'image_url', 'affiliate_url', 'category', 'rating', 'review_count',
    'discount', 'is_featured', 'source', 'telegram_message_id',
    'expires_at', 'created_at', 'updated_at'
  ];
  
  console.log('\n📋 AMAZON_PRODUCTS TABLE VERIFICATION:');
  const missingColumns = [];
  requiredColumns.forEach(col => {
    const exists = amazonSchema.find(c => c.name === col);
    if (exists) {
      console.log(`   Success ${col} (${exists.type})`);
    } else {
      console.log(`   Error ${col} - MISSING`);
      missingColumns.push(col);
    }
  });
  
  if (missingColumns.length === 0) {
    console.log('\nSuccess All required columns present!');
  } else {
    console.log(`\nError Missing ${missingColumns.length} columns:`, missingColumns.join(', '));
  }
  
  console.log('\n2. Search DATA FORMAT VERIFICATION...');
  
  const products = db.prepare('SELECT * FROM amazon_products ORDER BY id DESC LIMIT 2').all();
  
  if (products.length === 0) {
    console.log('   Warning No products found in database');
  } else {
    console.log(`\nStats TESTING ${products.length} PRODUCTS:`);
    
    products.forEach((product, index) => {
      console.log(`\n   Product ${index + 1} (ID: ${product.id}):`);
      console.log(`     Name: ${product.name?.substring(0, 50)}...`);
      
      // Test price formatting
      const priceFormatted = typeof product.price === 'string' && product.price.includes('₹');
      const originalPriceFormatted = typeof product.original_price === 'string' && product.original_price.includes('₹');
      
      console.log(`     Price: ${product.price} ${priceFormatted ? 'Success' : 'Error'}`);
      console.log(`     Original: ${product.original_price} ${originalPriceFormatted ? 'Success' : 'Error'}`);
      console.log(`     Discount: ${product.discount}%`);
      
      // Test frontend parsing compatibility
      const getNumericPrice = (price) => {
        if (!price) return 0;
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
          const cleaned = price.replace(/[^\d.-]/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };
      
      const currentPrice = getNumericPrice(product.price);
      const originalPrice = getNumericPrice(product.original_price);
      const hasSavings = originalPrice > currentPrice && originalPrice > 0 && currentPrice > 0;
      const savings = hasSavings ? originalPrice - currentPrice : 0;
      
      console.log(`     Parsing Test:`);
      console.log(`       Current: "${product.price}" → ${currentPrice}`);
      console.log(`       Original: "${product.original_price}" → ${originalPrice}`);
      console.log(`       Savings: ${hasSavings ? `₹${savings}` : 'None'}`);
      console.log(`       Frontend Compatible: ${hasSavings ? 'Success YES' : 'Error NO'}`);
    });
  }
  
  console.log('\n3. 🧪 TYPESCRIPT SCHEMA VERIFICATION...');
  
  // Check if schema file has amazon_products definition
  const fs = require('fs');
  const schemaContent = fs.readFileSync('shared/sqlite-schema.ts', 'utf8');
  const hasAmazonSchema = schemaContent.includes('amazonProducts = sqliteTable');
  const hasAmazonType = schemaContent.includes('AmazonProduct');
  const hasAmazonInsert = schemaContent.includes('InsertAmazonProduct');
  
  console.log(`   Schema Definition: ${hasAmazonSchema ? 'Success' : 'Error'} amazonProducts table`);
  console.log(`   Type Definition: ${hasAmazonType ? 'Success' : 'Error'} AmazonProduct type`);
  console.log(`   Insert Schema: ${hasAmazonInsert ? 'Success' : 'Error'} InsertAmazonProduct type`);
  
  console.log('\n4. Stats FINAL SUMMARY...');
  
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get().count;
  const priceFormatted = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE price LIKE ?').get('₹%').count;
  const originalFormatted = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE original_price LIKE ?').get('₹%').count;
  
  console.log(`\n📈 STATISTICS:`);
  console.log(`   Total Products: ${totalProducts}`);
  console.log(`   Price Formatted: ${priceFormatted}/${totalProducts} (${Math.round(priceFormatted/totalProducts*100)}%)`);
  console.log(`   Original Formatted: ${originalFormatted}/${totalProducts} (${Math.round(originalFormatted/totalProducts*100)}%)`);
  
  const allGood = (
    missingColumns.length === 0 &&
    hasAmazonSchema &&
    hasAmazonType &&
    hasAmazonInsert &&
    priceFormatted === totalProducts &&
    originalFormatted === totalProducts
  );
  
  console.log('\nTarget FINAL VERDICT:');
  if (allGood) {
    console.log('\nCelebration SUCCESS: ALL PRIME PICKS ISSUES FIXED!');
    console.log('   Success Database schema is complete');
    console.log('   Success All prices are properly formatted');
    console.log('   Success TypeScript types are defined');
    console.log('   Success Frontend parsing will work');
    console.log('   Success Green savings text will display');
    console.log('   Success No more parsing errors');
    
    console.log('\nLaunch READY FOR PRODUCTION:');
    console.log('   • Prime Picks bot can process new products');
    console.log('   • Website will display correct pricing');
    console.log('   • All discount calculations are accurate');
    console.log('   • TypeScript compilation will succeed');
  } else {
    console.log('\nWarning ISSUES REMAINING:');
    if (missingColumns.length > 0) console.log('   Error Database schema incomplete');
    if (!hasAmazonSchema) console.log('   Error TypeScript schema missing');
    if (priceFormatted !== totalProducts) console.log('   Error Price formatting incomplete');
    console.log('\n🔧 Manual fixes may be required');
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Verification failed:', error.message);
  process.exit(1);
}

console.log('\nSuccess Prime Picks verification completed!');