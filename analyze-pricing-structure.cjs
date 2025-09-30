// Analyze pricing data structure to determine display logic
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('🔍 Analyzing Pricing Data Structure\n');
  
  // Get sample products with different pricing structures
  const products = db.prepare(`
    SELECT 
      id, title, category, price, original_price,
      pricing_type, monthly_price, yearly_price, is_free, price_description
    FROM unified_content 
    LIMIT 10
  `).all();
  
  console.log('📊 Product Pricing Analysis:');
  console.log('============================\n');
  
  products.forEach(product => {
    console.log(`Product ID: ${product.id} - ${product.title}`);
    console.log(`Type: ${product.category}`);
    
    // Analyze pricing structure
    const hasSimplePricing = product.price || product.original_price;
    const hasComplexPricing = product.pricing_type || product.monthly_price || product.yearly_price || product.is_free;
    
    console.log(`Simple Pricing: ${hasSimplePricing ? '✅' : '❌'}`);
    if (hasSimplePricing) {
      console.log(`  - Current Price: ${product.price || 'N/A'}`);
      console.log(`  - Original Price: ${product.original_price || 'N/A'}`);
      console.log(`  - Currency: INR (default)`);
    }
    
    console.log(`Complex Pricing: ${hasComplexPricing ? '✅' : '❌'}`);
    if (hasComplexPricing) {
      console.log(`  - Pricing Type: ${product.pricing_type || 'N/A'}`);
      console.log(`  - Monthly Price: ${product.monthly_price || 'N/A'}`);
      console.log(`  - Yearly Price: ${product.yearly_price || 'N/A'}`);
      console.log(`  - Is Free: ${product.is_free ? 'Yes' : 'No'}`);
      console.log(`  - Description: ${product.price_description || 'N/A'}`);
    }
    
    // Determine display logic
    console.log(`Display Logic:`);
    if (hasComplexPricing) {
      console.log(`  - Should show: PRICING TAGS (current system)`);
    } else if (hasSimplePricing) {
      console.log(`  - Should show: NORMAL PRICING (current/original/discount)`);
    } else {
      console.log(`  - Should show: NO PRICING INFO`);
    }
    
    console.log('─'.repeat(50));
  });
  
  // Summary statistics
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN price IS NOT NULL OR original_price IS NOT NULL THEN 1 END) as has_simple_pricing,
      COUNT(CASE WHEN pricing_type IS NOT NULL OR monthly_price IS NOT NULL OR yearly_price IS NOT NULL OR is_free = 1 THEN 1 END) as has_complex_pricing,
      COUNT(CASE WHEN (price IS NOT NULL OR original_price IS NOT NULL) AND (pricing_type IS NOT NULL OR monthly_price IS NOT NULL OR yearly_price IS NOT NULL OR is_free = 1) THEN 1 END) as has_both_pricing
    FROM unified_content
  `).get();
  
  console.log('\n📈 Pricing Statistics:');
  console.log('======================');
  console.log(`Total Products: ${stats.total}`);
  console.log(`Products with Simple Pricing: ${stats.has_simple_pricing}`);
  console.log(`Products with Complex Pricing: ${stats.has_complex_pricing}`);
  console.log(`Products with Both Pricing Types: ${stats.has_both_pricing}`);
  
  console.log('\n💡 Recommended Display Logic:');
  console.log('=============================');
  console.log('1. If product has complex pricing (pricingType, monthly/yearly, free):');
  console.log('   → Show PRICING TAGS as currently implemented');
  console.log('2. If product has simple pricing (price, originalPrice):');
  console.log('   → Show NORMAL PRICING: current price, original price (strikethrough), discount');
  console.log('3. If product has both:');
  console.log('   → Prioritize complex pricing (tags) but also show discount if applicable');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error analyzing pricing structure:', error.message);
}