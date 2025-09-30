const Database = require('better-sqlite3');

console.log('🔍 Checking products status in database...');

const db = new Database('./database.sqlite');

try {
    // Check total products
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(`📊 Total products: ${totalProducts.count}`);
    
    // Check active products
    const activeProducts = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE processing_status = 'active'").get();
    console.log(`✅ Active products: ${activeProducts.count}`);
    
    // Check products with null processing_status
    const nullStatusProducts = db.prepare('SELECT COUNT(*) as count FROM unified_content WHERE processing_status IS NULL').get();
    console.log(`❓ Products with null status: ${nullStatusProducts.count}`);
    
    // Check all processing statuses
    const statusCounts = db.prepare(`
        SELECT processing_status, COUNT(*) as count 
        FROM unified_content 
        GROUP BY processing_status
    `).all();
    
    console.log('\n📋 Processing status breakdown:');
    statusCounts.forEach(status => {
        console.log(`   ${status.processing_status || 'NULL'}: ${status.count}`);
    });
    
    // Check recent products
    console.log('\n🕒 Recent products:');
    const recentProducts = db.prepare(`
        SELECT id, title, processing_status, display_pages, price, affiliate_url
        FROM unified_content 
        ORDER BY created_at DESC 
        LIMIT 5
    `).all();
    
    recentProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ID: ${product.id}`);
        console.log(`      Title: ${product.title}`);
        console.log(`      Status: ${product.processing_status || 'NULL'}`);
        console.log(`      Pages: ${product.display_pages || 'NULL'}`);
        console.log(`      Price: ${product.price || 'NULL'}`);
        console.log(`      Affiliate URL: ${product.affiliate_url ? 'YES' : 'NO'}`);
        console.log('');
    });
    
    // Update products to have active status if they don't have one
    const updateResult = db.prepare(`
        UPDATE unified_content 
        SET processing_status = 'active' 
        WHERE processing_status IS NULL OR processing_status = ''
    `).run();
    
    console.log(`🔄 Updated ${updateResult.changes} products to active status`);
    
    // Check active products again
    const activeProductsAfter = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE processing_status = 'active'").get();
    console.log(`✅ Active products after update: ${activeProductsAfter.count}`);
    
} catch (error) {
    console.error('❌ Error checking products:', error);
} finally {
    db.close();
}