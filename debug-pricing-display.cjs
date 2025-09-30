const Database = require('better-sqlite3');
const path = require('path');

// Use the correct database path
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('🔍 Debugging pricing display for products...\n');
console.log('Using database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Get products with original prices
  const products = db.prepare(`
    SELECT id, title, price, original_price, pricing_type, 
           price_description, is_free, monthly_price, yearly_price
    FROM unified_content 
    WHERE original_price IS NOT NULL 
    AND original_price != '' 
    AND original_price != '0'
    AND CAST(original_price AS REAL) > 0
    ORDER BY id
  `).all();
  
  console.log(`Found ${products.length} products with original prices:\n`);
  
  products.forEach(product => {
    console.log(`📦 Product ID ${product.id}: ${product.title}`);
    console.log(`   Price: ${product.price} (${typeof product.price})`);
    console.log(`   Original Price: ${product.original_price} (${typeof product.original_price})`);
    console.log(`   Pricing Type: ${product.pricing_type || 'null'}`);
    console.log(`   Is Free: ${product.is_free || 'null'}`);
    console.log(`   Monthly Price: ${product.monthly_price || 'null'}`);
    console.log(`   Yearly Price: ${product.yearly_price || 'null'}`);
    
    // Calculate discount percentage
    const originalPrice = parseFloat(product.original_price) || 0;
    const currentPrice = parseFloat(product.price) || 0;
    let calculatedDiscount = 0;
    
    if (originalPrice > 0 && currentPrice > 0 && originalPrice > currentPrice) {
      calculatedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    
    console.log(`   Calculated Discount: ${calculatedDiscount}%`);
    console.log(`   Should Show Original Price: ${originalPrice > 0 && originalPrice > currentPrice ? 'YES' : 'NO'}`);
    console.log(`   Should Show Discount: ${calculatedDiscount > 0 ? 'YES' : 'NO'}`);
    console.log('');
  });
  
  // Test the exact conditions used in EnhancedPriceTag
  console.log('🧪 Testing EnhancedPriceTag conditions:\n');
  
  products.forEach(product => {
    console.log(`Testing Product ID ${product.id}:`);
    
    // Simulate the exact logic from EnhancedPriceTag
    const originalPrice = product.original_price;
    const hasOriginal = originalPrice !== undefined && originalPrice !== null && 
      String(originalPrice) !== '' && String(originalPrice) !== '0' && 
      (parseFloat(String(originalPrice)) || 0) > 0;
    
    const price = product.price;
    const hasSimplePrice = (parseFloat(String(price)) || 0) > 0;
    
    const isFree = product.is_free;
    const pricingType = product.pricing_type;
    const monthlyPrice = product.monthly_price;
    const yearlyPrice = product.yearly_price;
    
    const hasMonthly = (parseFloat(String(monthlyPrice)) || 0) > 0;
    const hasYearly = (parseFloat(String(yearlyPrice)) || 0) > 0;
    
    const hasComplexPricing = isFree || pricingType === 'free' || hasMonthly || hasYearly || 
      (pricingType && pricingType !== 'one-time' && pricingType !== 'One-time Payment');
    
    console.log(`   hasOriginal: ${hasOriginal}`);
    console.log(`   hasSimplePrice: ${hasSimplePrice}`);
    console.log(`   hasComplexPricing: ${hasComplexPricing}`);
    console.log(`   Will render normal pricing: ${hasSimplePrice && !hasComplexPricing ? 'YES' : 'NO'}`);
    console.log(`   Will show original price: ${hasOriginal && hasSimplePrice ? 'YES' : 'NO'}`);
    console.log('');
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}