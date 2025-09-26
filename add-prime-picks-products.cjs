const Database = require('better-sqlite3');

console.log('🎯 ADDING PRIME PICKS PRODUCTS');
console.log('==============================');

try {
    const db = new Database('./database.sqlite');
    
    // Sample prime-picks products
    const products = [
        {
            title: 'Premium Wireless Earbuds - Bot Demo',
            description: 'High-quality wireless earbuds with active noise cancellation',
            price: '₹1,999',
            original_price: '₹4,999',
            image_url: 'https://via.placeholder.com/300x300/06B6D4/white?text=Earbuds',
            affiliate_url: 'https://www.amazon.in/premium-earbuds/dp/B08DEMO123',
            display_pages: '["prime-picks"]',
            category: 'Electronics',
            content_type: 'product',
            page_type: 'prime-picks',
            source_type: 'bot',
            status: 'published',
            processing_status: 'active'
        },
        {
            title: 'Smart Fitness Watch - Prime Deal',
            description: 'Advanced fitness tracking with heart rate monitoring',
            price: '₹2,499',
            original_price: '₹5,999',
            image_url: 'https://via.placeholder.com/300x300/10B981/white?text=Watch',
            affiliate_url: 'https://www.amazon.in/smart-watch/dp/B08DEMO456',
            display_pages: '["prime-picks"]',
            category: 'Fitness',
            content_type: 'product',
            page_type: 'prime-picks',
            source_type: 'bot',
            status: 'published',
            processing_status: 'active'
        },
        {
            title: 'Portable Power Bank 20000mAh',
            description: 'Fast charging power bank with multiple ports',
            price: '₹1,299',
            original_price: '₹2,999',
            image_url: 'https://via.placeholder.com/300x300/F59E0B/white?text=PowerBank',
            affiliate_url: 'https://www.amazon.in/power-bank/dp/B08DEMO789',
            display_pages: '["prime-picks"]',
            category: 'Accessories',
            content_type: 'product',
            page_type: 'prime-picks',
            source_type: 'bot',
            status: 'published',
            processing_status: 'active'
        }
    ];
    
    const stmt = db.prepare(`
        INSERT INTO unified_content (
            title, description, price, original_price, image_url, 
            affiliate_url, display_pages, category, content_type, 
            page_type, source_type, status, processing_status,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    console.log('📦 Adding products to database...');
    
    products.forEach((product, index) => {
        try {
            const result = stmt.run(
                product.title,
                product.description,
                product.price,
                product.original_price,
                product.image_url,
                product.affiliate_url,
                product.display_pages,
                product.category,
                product.content_type,
                product.page_type,
                product.source_type,
                product.status,
                product.processing_status
            );
            
            console.log(`✅ ${index + 1}. ${product.title} (ID: ${result.lastInsertRowid})`);
        } catch (error) {
            console.error(`❌ Failed to add ${product.title}:`, error.message);
        }
    });
    
    // Verify products were added
    const primePicksCount = db.prepare(`
        SELECT COUNT(*) as count FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%'
    `).get();
    
    console.log(`\n🎯 Total prime-picks products: ${primePicksCount.count}`);
    
    db.close();
    console.log('✅ Products added successfully!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}