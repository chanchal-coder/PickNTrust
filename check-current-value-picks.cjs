// Check Current Value Picks Products and Images
const Database = require('better-sqlite3');

console.log('Search CHECKING CURRENT VALUE PICKS PRODUCTS');
console.log('=' .repeat(50));

try {
  const db = new Database('database.sqlite');
  
  const products = db.prepare(`
    SELECT id, name, image_url, affiliate_url, original_url, created_at 
    FROM value_picks_products 
    WHERE processing_status = 'active' 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  console.log(`\nStats Found ${products.length} active Value Picks products`);
  
  if (products.length === 0) {
    console.log('\nWarning No active Value Picks products found');
    console.log('Tip This means either:');
    console.log('   1. No products have been processed yet');
    console.log('   2. All products were cleared by the fix script');
    console.log('   3. Bot is not processing new messages');
  } else {
    console.log('\nSearch Current Products Analysis:');
    
    products.forEach((product, index) => {
      const isPlaceholderImage = product.image_url && (
        product.image_url.includes('unsplash') ||
        product.image_url.includes('placeholder') ||
        product.image_url.includes('via.placeholder') ||
        product.image_url.includes('images.unsplash.com')
      );
      
      const hasEkaroAffiliate = product.affiliate_url && product.affiliate_url.includes('ekaro.in/enkr2020/');
      const hasOriginalUrl = product.original_url && product.original_url.startsWith('http');
      
      console.log(`\n   ${index + 1}. ${product.name}`);
      console.log(`      🖼️ Image: ${product.image_url || 'No image'}`);
      console.log(`      📸 Image Status: ${isPlaceholderImage ? 'Error Placeholder/Stock' : 'Success Product Image'}`);
      console.log(`      Link Affiliate: ${hasEkaroAffiliate ? 'Success EKaro' : 'Error Wrong/Missing'}`);
      console.log(`      📄 Original URL: ${hasOriginalUrl ? 'Success Present' : 'Error Missing'}`);
      console.log(`      Date Created: ${new Date(product.created_at * 1000).toLocaleString()}`);
      
      if (isPlaceholderImage) {
        console.log(`      Warning ISSUE: Using placeholder image instead of real product image`);
      }
    });
    
    // Summary
    const placeholderCount = products.filter(p => 
      p.image_url && (
        p.image_url.includes('unsplash') ||
        p.image_url.includes('placeholder') ||
        p.image_url.includes('via.placeholder') ||
        p.image_url.includes('images.unsplash.com')
      )
    ).length;
    
    const ekaroCount = products.filter(p => 
      p.affiliate_url && p.affiliate_url.includes('ekaro.in/enkr2020/')
    ).length;
    
    console.log('\nStats SUMMARY:');
    console.log(`   Total Products: ${products.length}`);
    console.log(`   Placeholder Images: ${placeholderCount} (${placeholderCount > 0 ? 'Error ISSUE' : 'Success Good'})`);
    console.log(`   Real Images: ${products.length - placeholderCount} (${products.length - placeholderCount > 0 ? 'Success Good' : 'Error ISSUE'})`);
    console.log(`   EKaro Affiliates: ${ekaroCount} (${ekaroCount === products.length ? 'Success All Good' : 'Error Some Wrong'})`);
    
    if (placeholderCount > 0) {
      console.log('\n🔧 DIAGNOSIS:');
      console.log('   Error Image extraction is still using fallback/placeholder images');
      console.log('   Tip This means the enhanced image selectors are not working');
      console.log('   🛠️ Need to debug the actual product page scraping');
    }
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error checking Value Picks products:', error.message);
}