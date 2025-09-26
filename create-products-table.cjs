const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔧 CREATING PRODUCTS TABLE');
console.log('==========================\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database\n');
});

// Create products table with all necessary columns
const createProductsTable = `
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT,
    original_price TEXT,
    currency TEXT DEFAULT 'INR',
    image_url TEXT,
    affiliate_url TEXT,
    original_url TEXT,
    category TEXT,
    subcategory TEXT,
    rating REAL,
    review_count INTEGER,
    discount INTEGER,
    is_new INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    affiliate_network TEXT,
    telegram_message_id INTEGER,
    telegram_channel_id INTEGER,
    telegram_channel_name TEXT,
    processing_status TEXT DEFAULT 'active',
    content_type TEXT,
    affiliate_tag_applied INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    source TEXT,
    expires_at INTEGER,
    display_pages TEXT,
    metadata TEXT
);
`;

db.run(createProductsTable, (err) => {
    if (err) {
        console.error('❌ Error creating products table:', err.message);
        return;
    }
    
    console.log('✅ Products table created successfully!\n');
    
    // Verify the table was created
    db.all("PRAGMA table_info(products)", (err, columns) => {
        if (err) {
            console.error('❌ Error getting table info:', err.message);
            return;
        }
        
        console.log('📋 PRODUCTS TABLE SCHEMA:');
        console.log('=========================');
        columns.forEach(col => {
            console.log(`- ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
        });
        
        // Check if display_pages column exists
        const displayPagesCol = columns.find(c => c.name === 'display_pages');
        console.log(`\n🏷️  display_pages column: ${displayPagesCol ? '✅ EXISTS' : '❌ MISSING'}\n`);
        
        // Add some sample data for testing
        console.log('📦 Adding sample product data...\n');
        
        const sampleProducts = [
            {
                name: 'Sample Prime Product',
                description: 'A great product for prime picks',
                price: '₹999',
                original_price: '₹1299',
                category: 'Electronics',
                display_pages: '["prime-picks"]',
                content_type: 'prime-picks',
                processing_status: 'active'
            },
            {
                name: 'Sample Value Product',
                description: 'Best value for money',
                price: '₹499',
                original_price: '₹799',
                category: 'Home',
                display_pages: '["value-picks"]',
                content_type: 'value-picks',
                processing_status: 'active'
            },
            {
                name: 'Sample Top Pick',
                description: 'Top recommended product',
                price: '₹1499',
                original_price: '₹1999',
                category: 'Fashion',
                display_pages: '["top-picks"]',
                content_type: 'top-picks',
                processing_status: 'active',
                is_featured: 1
            },
            {
                name: 'Sample Global Product',
                description: 'International product',
                price: '$29.99',
                original_price: '$39.99',
                currency: 'USD',
                category: 'Books',
                display_pages: '["global-picks"]',
                content_type: 'global-picks',
                processing_status: 'active'
            },
            {
                name: 'Sample Deal Hub Product',
                description: 'Amazing deal',
                price: '₹299',
                original_price: '₹599',
                category: 'Sports',
                display_pages: '["deals-hub"]',
                content_type: 'deals-hub',
                processing_status: 'active'
            }
        ];
        
        let insertedCount = 0;
        sampleProducts.forEach((product, index) => {
            const insertQuery = `
                INSERT INTO products (name, description, price, original_price, currency, category, display_pages, content_type, processing_status, is_featured)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(insertQuery, [
                product.name,
                product.description,
                product.price,
                product.original_price,
                product.currency || 'INR',
                product.category,
                product.display_pages,
                product.content_type,
                product.processing_status,
                product.is_featured || 0
            ], (err) => {
                if (err) {
                    console.error(`❌ Error inserting product ${index + 1}:`, err.message);
                } else {
                    console.log(`✅ Inserted: ${product.name}`);
                }
                
                insertedCount++;
                if (insertedCount === sampleProducts.length) {
                    // Verify the data was inserted
                    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
                        if (err) {
                            console.error('❌ Error counting products:', err.message);
                        } else {
                            console.log(`\n📊 Total products in table: ${row.count}`);
                        }
                        
                        db.close((err) => {
                            if (err) {
                                console.error('❌ Error closing database:', err.message);
                            } else {
                                console.log('\n✅ Database setup complete!');
                            }
                        });
                    });
                }
            });
        });
    });
});