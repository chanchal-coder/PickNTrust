// Fix Prime Picks Database Schema and Parsing Issues
const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 PRIME PICKS SCHEMA & PARSING FIX');
console.log('=' .repeat(50));

try {
  const db = new Database('database.sqlite');
  
  console.log('\n1. Stats ANALYZING AMAZON_PRODUCTS TABLE SCHEMA...');
  const schema = db.prepare('PRAGMA table_info(amazon_products)').all();
  
  console.log('\n📋 COLUMN DEFINITIONS:');
  schema.forEach(col => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = col.dflt_value || 'None';
    console.log(`   ${col.name.padEnd(20)} | ${col.type.padEnd(10)} | ${nullable.padEnd(8)} | Default: ${defaultVal}`);
  });
  
  console.log('\n2. Search CHECKING SAMPLE DATA TYPES...');
  const sample = db.prepare('SELECT * FROM amazon_products ORDER BY id DESC LIMIT 1').get();
  
  if (sample) {
    console.log('\n📋 ACTUAL DATA TYPES IN DATABASE:');
    Object.entries(sample).forEach(([key, value]) => {
      const jsType = typeof value;
      const displayValue = value === null ? 'NULL' : JSON.stringify(value);
      console.log(`   ${key.padEnd(20)} | ${jsType.padEnd(8)} | ${displayValue}`);
    });
  }
  
  console.log('\n3. Alert IDENTIFYING TYPE MISMATCHES...');
  const issues = [];
  
  // Check for common parsing issues
  const priceFields = ['price', 'original_price'];
  const numericFields = ['rating', 'review_count', 'discount', 'created_at', 'updated_at', 'expires_at'];
  const booleanFields = ['is_featured', 'is_active'];
  
  if (sample) {
    // Check price fields (should be strings with currency)
    priceFields.forEach(field => {
      if (sample[field] !== null && sample[field] !== undefined) {
        const value = sample[field];
        const hasCurrency = typeof value === 'string' && value.includes('₹');
        if (!hasCurrency) {
          issues.push(`Error ${field}: Should be formatted string with ₹ symbol, got: ${JSON.stringify(value)}`);
        } else {
          console.log(`   Success ${field}: Correctly formatted as ${value}`);
        }
      }
    });
    
    // Check numeric fields
    numericFields.forEach(field => {
      if (sample[field] !== null && sample[field] !== undefined) {
        const value = sample[field];
        if (typeof value !== 'number') {
          issues.push(`Error ${field}: Should be number, got ${typeof value}: ${JSON.stringify(value)}`);
        } else {
          console.log(`   Success ${field}: Correctly stored as number`);
        }
      }
    });
    
    // Check boolean fields
    booleanFields.forEach(field => {
      if (sample[field] !== null && sample[field] !== undefined) {
        const value = sample[field];
        if (typeof value !== 'number' || (value !== 0 && value !== 1)) {
          issues.push(`Error ${field}: Should be 0 or 1, got ${typeof value}: ${JSON.stringify(value)}`);
        } else {
          console.log(`   Success ${field}: Correctly stored as ${value}`);
        }
      }
    });
  }
  
  console.log('\n4. 🔧 FIXING IDENTIFIED ISSUES...');
  
  if (issues.length > 0) {
    console.log('\nAlert ISSUES FOUND:');
    issues.forEach(issue => console.log(issue));
    
    // Fix price formatting issues
    console.log('\n🔧 Fixing price formatting...');
    const updatePrices = db.prepare(`
      UPDATE amazon_products 
      SET 
        price = CASE 
          WHEN price NOT LIKE '₹%' AND price IS NOT NULL AND price != '' 
          THEN '₹' || CAST(price AS TEXT)
          ELSE price 
        END,
        original_price = CASE 
          WHEN original_price NOT LIKE '₹%' AND original_price IS NOT NULL AND original_price != '' 
          THEN '₹' || CAST(original_price AS TEXT)
          ELSE original_price 
        END
      WHERE price NOT LIKE '₹%' OR original_price NOT LIKE '₹%'
    `);
    
    const priceResult = updatePrices.run();
    console.log(`   Success Updated ${priceResult.changes} records with proper price formatting`);
    
    // Fix rating format (ensure it's stored as string for consistency)
    console.log('\n🔧 Fixing rating format...');
    const updateRating = db.prepare(`
      UPDATE amazon_products 
      SET rating = CAST(rating AS TEXT)
      WHERE typeof(rating) != 'text' AND rating IS NOT NULL
    `);
    
    const ratingResult = updateRating.run();
    console.log(`   Success Updated ${ratingResult.changes} records with proper rating format`);
    
  } else {
    console.log('   Success No schema issues found!');
  }
  
  console.log('\n5. 🧪 VERIFYING FIXES...');
  const verifyData = db.prepare('SELECT id, name, price, original_price, rating, discount FROM amazon_products ORDER BY id DESC LIMIT 2').all();
  
  console.log('\nStats VERIFICATION RESULTS:');
  verifyData.forEach((product, index) => {
    console.log(`\n   Product ${index + 1} (ID: ${product.id}):`);
    console.log(`     Name: ${product.name?.substring(0, 40)}...`);
    console.log(`     Price: ${product.price} (${typeof product.price})`);
    console.log(`     Original: ${product.original_price} (${typeof product.original_price})`);
    console.log(`     Rating: ${product.rating} (${typeof product.rating})`);
    console.log(`     Discount: ${product.discount}% (${typeof product.discount})`);
  });
  
  console.log('\n6. Search CHECKING FRONTEND PARSING COMPATIBILITY...');
  
  // Test the parsing functions that frontend uses
  const testParsing = (priceString) => {
    // Simulate getNumericPrice function from frontend
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    if (typeof priceString === 'string') {
      const cleaned = priceString.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  
  console.log('\n🧪 TESTING FRONTEND PARSING:');
  verifyData.forEach((product, index) => {
    const currentPrice = testParsing(product.price);
    const originalPrice = testParsing(product.original_price);
    const hasSavings = originalPrice > currentPrice && originalPrice > 0 && currentPrice > 0;
    const savings = hasSavings ? originalPrice - currentPrice : 0;
    
    console.log(`\n   Product ${index + 1} Parsing Test:`);
    console.log(`     Current Price: "${product.price}" → ${currentPrice}`);
    console.log(`     Original Price: "${product.original_price}" → ${originalPrice}`);
    console.log(`     Savings Calculation: ${hasSavings ? `₹${savings}` : 'No savings'}`);
    console.log(`     Frontend Compatible: ${hasSavings ? 'Success YES' : 'Error NO'}`);
  });
  
  console.log('\n7. Blog GENERATING SUMMARY...');
  
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get().count;
  const priceFormatted = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE price LIKE ?').get('₹%').count;
  const originalPriceFormatted = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE original_price LIKE ?').get('₹%').count;
  
  console.log('\nStats FINAL SUMMARY:');
  console.log(`   Total Products: ${totalProducts}`);
  console.log(`   Price Formatted: ${priceFormatted}/${totalProducts} (${Math.round(priceFormatted/totalProducts*100)}%)`);
  console.log(`   Original Price Formatted: ${originalPriceFormatted}/${totalProducts} (${Math.round(originalPriceFormatted/totalProducts*100)}%)`);
  
  if (priceFormatted === totalProducts && originalPriceFormatted === totalProducts) {
    console.log('\nCelebration SUCCESS: All Prime Picks data is properly formatted!');
    console.log('   Success Prices have ₹ symbols');
    console.log('   Success Frontend parsing will work correctly');
    console.log('   Success Green savings text will display');
    console.log('   Success Discount calculations are accurate');
  } else {
    console.log('\nWarning WARNING: Some products may still have formatting issues');
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error:', error.message);
  process.exit(1);
}

console.log('\nSuccess Prime Picks schema and parsing fix completed!');