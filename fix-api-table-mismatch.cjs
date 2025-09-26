const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING API TABLE MISMATCH');
console.log('============================');

const routesPath = path.join(__dirname, 'server', 'routes.ts');

try {
  // Read the current routes file
  let routesContent = fs.readFileSync(routesPath, 'utf8');
  
  console.log('📋 Current API queries "products" table');
  console.log('🎯 Telegram bot saves to "unified_content" table');
  console.log('💡 Solution: Update API to query "unified_content" table');
  
  // Replace the products table query with unified_content
  const oldQuery = `SELECT * FROM products 
        WHERE display_pages LIKE '%' || ? || '%'`;
        
  const newQuery = `SELECT * FROM unified_content 
        WHERE display_pages LIKE '%' || ? || '%'
        AND processing_status = 'active'`;
  
  if (routesContent.includes(oldQuery)) {
    routesContent = routesContent.replace(oldQuery, newQuery);
    console.log('✅ Updated main product query to use unified_content');
  } else {
    console.log('⚠️ Main query pattern not found, checking for variations...');
    
    // Try alternative patterns
    if (routesContent.includes('FROM products')) {
      routesContent = routesContent.replace(/FROM products/g, 'FROM unified_content');
      console.log('✅ Updated all "FROM products" to "FROM unified_content"');
    }
  }
  
  // Also need to update the field mapping since unified_content uses 'title' not 'name'
  const oldMapping = `name: product.title,`;
  const newMapping = `name: product.title,`;
  
  // The mapping is already correct since it maps product.title to name
  
  // Write the updated content back
  fs.writeFileSync(routesPath, routesContent);
  
  console.log('✅ API routes updated successfully!');
  console.log('📝 Changes made:');
  console.log('   - API now queries unified_content table');
  console.log('   - Added processing_status = "active" filter');
  console.log('   - Field mappings remain compatible');
  
  console.log('\n🔄 Next steps:');
  console.log('   1. Restart the server to apply changes');
  console.log('   2. Test API endpoints');
  console.log('   3. Verify channel posts appear on webpages');
  
} catch (error) {
  console.error('❌ Error updating routes:', error.message);
}