const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔧 Creating unified_content table on production...');

// Find the database file
const possiblePaths = [
    path.join(__dirname, 'database.sqlite'),
    path.join(__dirname, 'sqlite.db'),
    path.join(__dirname, 'server', 'database.sqlite'),
    path.join(__dirname, 'server', 'sqlite.db')
];

let dbPath = null;
for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
        dbPath = testPath;
        console.log(`📁 Found database at: ${dbPath}`);
        break;
    }
}

if (!dbPath) {
    console.error('❌ No database file found! Creating new database...');
    dbPath = path.join(__dirname, 'database.sqlite');
}

try {
    const db = new Database(dbPath);
    
    // Check if unified_content table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='unified_content'").all();
    
    if (tables.length > 0) {
        console.log('✅ unified_content table already exists!');
    } else {
        console.log('🔨 Creating unified_content table...');
        
        // Create the unified_content table with all necessary columns
        const createTableSQL = `
            CREATE TABLE unified_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                price REAL,
                image_url TEXT,
                affiliate_url TEXT,
                category TEXT,
                rating REAL DEFAULT 0,
                review_count INTEGER DEFAULT 0,
                is_featured INTEGER DEFAULT 0,
                is_service INTEGER DEFAULT 0,
                custom_fields TEXT,
                has_timer INTEGER DEFAULT 0,
                timer_duration INTEGER,
                timer_start_time INTEGER,
                gender TEXT,
                is_new INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        `;
        
        db.prepare(createTableSQL).run();
        console.log('✅ unified_content table created successfully!');
        
        // Create indexes for better performance
        console.log('🔍 Creating indexes...');
        db.prepare('CREATE INDEX idx_unified_content_category ON unified_content(category)').run();
        db.prepare('CREATE INDEX idx_unified_content_featured ON unified_content(is_featured)').run();
        db.prepare('CREATE INDEX idx_unified_content_created_at ON unified_content(created_at)').run();
        db.prepare('CREATE INDEX idx_unified_content_status ON unified_content(status)').run();
        console.log('✅ Indexes created successfully!');
    }
    
    // Check if we need to migrate data from other tables
    const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\n📊 Available tables:', allTables.map(t => t.name));
    
    const productTables = allTables.filter(t => 
        t.name.includes('product') && t.name !== 'unified_content'
    );
    
    if (productTables.length > 0) {
        console.log('\n🔄 Found product tables to migrate:');
        productTables.forEach(table => {
            console.log(`  - ${table.name}`);
        });
        
        // Try to migrate from the first product table found
        const sourceTable = productTables[0].name;
        console.log(`\n📦 Migrating data from ${sourceTable}...`);
        
        try {
            // Get source table schema
            const sourceSchema = db.prepare(`PRAGMA table_info(${sourceTable})`).all();
            const sourceColumns = sourceSchema.map(col => col.name);
            
            // Map common columns
            const columnMapping = {
                'name': 'title',
                'title': 'title',
                'description': 'description',
                'price': 'price',
                'image_url': 'image_url',
                'affiliate_url': 'affiliate_url',
                'category': 'category',
                'rating': 'rating',
                'review_count': 'review_count',
                'is_featured': 'is_featured',
                'created_at': 'created_at'
            };
            
            // Build migration query
            const selectColumns = [];
            const insertColumns = [];
            
            for (const [sourceCol, targetCol] of Object.entries(columnMapping)) {
                if (sourceColumns.includes(sourceCol)) {
                    selectColumns.push(sourceCol);
                    insertColumns.push(targetCol);
                }
            }
            
            if (selectColumns.length > 0) {
                const migrationSQL = `
                    INSERT INTO unified_content (${insertColumns.join(', ')})
                    SELECT ${selectColumns.join(', ')}
                    FROM ${sourceTable}
                `;
                
                const result = db.prepare(migrationSQL).run();
                console.log(`✅ Migrated ${result.changes} records from ${sourceTable}`);
            }
            
        } catch (error) {
            console.log(`⚠️ Could not migrate from ${sourceTable}: ${error.message}`);
        }
    }
    
    // Add some sample featured products if table is empty
    const count = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    console.log(`\n📈 Total records in unified_content: ${count.count}`);
    
    if (count.count === 0) {
        console.log('📦 Adding sample featured products...');
        
        const sampleProducts = [
            {
                title: '🚀 MEGA DEAL: Gaming Mechanical Keyboard',
                description: 'Premium RGB mechanical keyboard with blue switches',
                price: 89.99,
                category: 'Electronics',
                rating: 4.8,
                review_count: 1250,
                is_featured: 1
            },
            {
                title: '💎 BEST VALUE: Smart Fitness Watch 2024',
                description: 'Advanced fitness tracking with heart rate monitor',
                price: 199.99,
                category: 'Fitness',
                rating: 4.6,
                review_count: 890,
                is_featured: 1
            },
            {
                title: '🔥 FLASH DEAL: Premium Wireless Earbuds Pro Max',
                description: 'Noise-cancelling wireless earbuds with premium sound',
                price: 149.99,
                category: 'Audio',
                rating: 4.7,
                review_count: 2100,
                is_featured: 1
            }
        ];
        
        const insertSQL = `
            INSERT INTO unified_content (title, description, price, category, rating, review_count, is_featured, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertStmt = db.prepare(insertSQL);
        const now = Math.floor(Date.now() / 1000);
        
        sampleProducts.forEach(product => {
            insertStmt.run(
                product.title,
                product.description,
                product.price,
                product.category,
                product.rating,
                product.review_count,
                product.is_featured,
                now
            );
        });
        
        console.log(`✅ Added ${sampleProducts.length} sample products`);
    }
    
    // Final verification
    const finalCount = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    const featuredCount = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE is_featured = 1").get();
    
    console.log(`\n📊 Final stats:`);
    console.log(`  Total products: ${finalCount.count}`);
    console.log(`  Featured products: ${featuredCount.count}`);
    
    db.close();
    console.log('\n✅ unified_content table setup completed successfully!');
    
} catch (error) {
    console.error('❌ Error setting up unified_content table:', error.message);
    process.exit(1);
}