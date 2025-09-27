const Database = require('better-sqlite3');
const path = require('path');

// Use the correct database path for production
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

try {
    const db = new Database(dbPath);
    
    // Check if database exists and has the unified_content table
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Available tables:', tables.map(t => t.name));
    
    if (!tables.find(t => t.name === 'unified_content')) {
        console.error('unified_content table not found!');
        process.exit(1);
    }
    
    // Get schema for unified_content table
    const schema = db.prepare("PRAGMA table_info(unified_content)").all();
    console.log('unified_content schema:', schema.map(col => col.name));
    
    // First, remove featured status from test products
    console.log('\n🔍 Checking for test products...');
    const testProducts = db.prepare(`
        SELECT id, title, is_featured 
        FROM unified_content 
        WHERE title LIKE '%test%' OR title LIKE '%TEST%' OR title LIKE '%Test%'
    `).all();
    
    console.log(`Found ${testProducts.length} test products:`, testProducts);
    
    if (testProducts.length > 0) {
        const removeTestFeatured = db.prepare(`
            UPDATE unified_content 
            SET is_featured = 0 
            WHERE title LIKE '%test%' OR title LIKE '%TEST%' OR title LIKE '%Test%'
        `);
        
        const result = removeTestFeatured.run();
        console.log(`✅ Removed featured status from ${result.changes} test products`);
    }
    
    // Now set real products as featured (up to 8)
    console.log('\n🔍 Setting real products as featured...');
    const realProducts = db.prepare(`
        SELECT id, title, price, category 
        FROM unified_content 
        WHERE (title NOT LIKE '%test%' AND title NOT LIKE '%TEST%' AND title NOT LIKE '%Test%')
        AND (status = 'active' OR status IS NULL)
        LIMIT 8
    `).all();
    
    console.log(`Found ${realProducts.length} real products to feature`);
    
    if (realProducts.length > 0) {
        // First, clear all featured status
        db.prepare('UPDATE unified_content SET is_featured = 0').run();
        
        // Then set the selected products as featured
        const setFeatured = db.prepare('UPDATE unified_content SET is_featured = 1 WHERE id = ?');
        
        realProducts.forEach(product => {
            setFeatured.run(product.id);
            console.log(`✅ Set as featured: ${product.title}`);
        });
    }
    
    // Verify the results
    console.log('\n📊 Final featured products:');
    const featuredProducts = db.prepare(`
        SELECT id, title, price, category 
        FROM unified_content 
        WHERE is_featured = 1 
        ORDER BY created_at DESC
    `).all();
    
    console.log(`Total featured products: ${featuredProducts.length}`);
    featuredProducts.forEach(product => {
        console.log(`- ${product.title} (${product.category}) - $${product.price}`);
    });
    
    db.close();
    console.log('\n✅ Production database fixes completed successfully!');
    
} catch (error) {
    console.error('❌ Error fixing production database:', error);
    process.exit(1);
}
