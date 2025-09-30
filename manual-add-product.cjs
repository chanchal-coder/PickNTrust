const Database = require('better-sqlite3');
const path = require('path');

console.log('🛒 Manually Adding Product to Database');
console.log('=====================================');

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    console.log('\n📝 Adding new product...');
    
    const stmt = db.prepare(`
        INSERT INTO unified_content (
            title, description, price, original_price, 
            discount, affiliate_url, image_url, 
            display_pages, content_type, page_type, category,
            source_type, affiliate_platform, currency,
            is_active, visibility, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
        'Manual Test Product - Wireless Headphones',
        'High-quality wireless headphones with noise cancellation. Perfect for work and travel.',
        '₹29.99',
        '₹59.99',
        50,
        'https://example.com/headphones',
        'https://via.placeholder.com/300x300?text=Wireless+Headphones',
        JSON.stringify(['prime-picks']),
        'product',
        'prime-picks',
        'Electronics',
        'manual',
        'amazon',
        'USD',
        1,
        'public'
    );
    
    console.log('✅ Product added successfully!');
    console.log('   Database ID:', result.lastInsertRowid);
    console.log('   Title: Manual Test Product - Wireless Headphones');
    console.log('   Price: $29.99 (was $59.99)');
    console.log('   Discount: 50% OFF');
    
    // Verify the product was added
    console.log('\n🔍 Verifying product in database...');
    const checkStmt = db.prepare(`
        SELECT id, title, price, discount, display_pages, created_at 
        FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%' 
        ORDER BY created_at DESC 
        LIMIT 1
    `);
    
    const latestProduct = checkStmt.get();
    if (latestProduct) {
        console.log('✅ Latest prime-picks product found:');
        console.log('   ID:', latestProduct.id);
        console.log('   Title:', latestProduct.title);
        console.log('   Price:', latestProduct.price);
        console.log('   Created:', latestProduct.created_at);
    }
    
    console.log('\n🌐 Now check the website to see if this product appears!');
    
} catch (error) {
    console.error('❌ Error adding product:', error.message);
} finally {
    db.close();
}