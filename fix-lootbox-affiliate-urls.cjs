/**
 * Fix Loot Box Affiliate URLs
 * Update existing products to use correct DeoDap affiliate format
 */

const Database = require('better-sqlite3');

console.log('🔧 FIXING LOOT BOX AFFILIATE URLS');
console.log('='.repeat(60));
console.log('🎯 Goal: Update affiliate URLs to correct DeoDap format');
console.log('📋 Format: {{URL}}{{SEP}}ref=sicvppak');
console.log('='.repeat(60));

try {
  const db = new Database('./database.sqlite');
  
  // Get all loot box products
  console.log('\n📊 Checking current loot box products...');
  const products = db.prepare('SELECT * FROM lootbox_products').all();
  console.log(`Found ${products.length} loot box products`);
  
  if (products.length === 0) {
    console.log('\n⚠️  No products found to update');
    db.close();
    return;
  }
  
  console.log('\n🔍 Current affiliate URL samples:');
  products.slice(0, 3).forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.name}`);
    console.log(`      Current URL: ${product.affiliate_url}`);
    console.log(`      Original URL: ${product.original_url}`);
  });
  
  console.log('\n🛠️  Updating affiliate URLs to DeoDap format...');
  
  // Function to convert URL to correct DeoDap format
  function convertToDeoDapFormat(originalUrl) {
    if (!originalUrl) return 'https://deodap.in';
    
    try {
      // Remove any existing affiliate parameters
      const url = new URL(originalUrl);
      
      // Remove common affiliate parameters
      const affiliateParams = ['ref', 'tag', 'affiliate', 'source', 'utm_source', 'utm_medium', 'utm_campaign'];
      affiliateParams.forEach(param => {
        url.searchParams.delete(param);
      });
      
      const cleanUrl = url.toString();
      
      // Apply DeoDap affiliate format
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}ref=sicvppak`;
      
    } catch (error) {
      // If URL parsing fails, just append the affiliate tag
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}ref=sicvppak`;
    }
  }
  
  // Update each product
  const updateStmt = db.prepare(`
    UPDATE lootbox_products 
    SET affiliate_url = ?
    WHERE id = ?
  `);
  
  let updatedCount = 0;
  
  products.forEach(product => {
    try {
      const newAffiliateUrl = convertToDeoDapFormat(product.original_url || product.affiliate_url);
      
      // Only update if the URL actually changed
      if (newAffiliateUrl !== product.affiliate_url) {
        updateStmt.run(newAffiliateUrl, product.id);
        updatedCount++;
        
        console.log(`   ✅ Updated: ${product.name}`);
        console.log(`      Old: ${product.affiliate_url}`);
        console.log(`      New: ${newAffiliateUrl}`);
      } else {
        console.log(`   ⏭️  Skipped: ${product.name} (already correct)`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to update ${product.name}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 Update Summary:`);
  console.log(`   Total products: ${products.length}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${products.length - updatedCount}`);
  
  // Verify the updates
  console.log('\n🔍 Verification - Updated affiliate URL samples:');
  const updatedProducts = db.prepare('SELECT * FROM lootbox_products LIMIT 3').all();
  updatedProducts.forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.name}`);
    console.log(`      Affiliate URL: ${product.affiliate_url}`);
    console.log(`      Contains ref=sicvppak: ${product.affiliate_url.includes('ref=sicvppak') ? '✅' : '❌'}`);
  });
  
  db.close();
  
  console.log('\n\n🎊 LOOT BOX AFFILIATE URL FIX COMPLETED!');
  console.log('='.repeat(50));
  console.log('✅ All loot box products now use correct DeoDap affiliate format');
  console.log('🔗 Format: {{URL}}{{SEP}}ref=sicvppak');
  console.log('🌐 Frontend will now show correct affiliate links');
  console.log('\n💡 Next steps:');
  console.log('   1. Refresh loot box page to see updated links');
  console.log('   2. Test clicking on product links');
  console.log('   3. Verify affiliate tracking works correctly');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
}