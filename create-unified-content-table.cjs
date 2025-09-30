const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'server', 'database.sqlite');

console.log('🔧 Creating Unified Content Table...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database\n');
});

// Create unified_content table with proper schema based on sqlite-schema.ts
function createUnifiedContentTable() {
    return new Promise((resolve, reject) => {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS unified_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                price TEXT,
                original_price TEXT,
                image_url TEXT NOT NULL,
                affiliate_url TEXT NOT NULL,
                
                -- Content Classification
                content_type TEXT NOT NULL,
                page_type TEXT NOT NULL,
                category TEXT NOT NULL,
                subcategory TEXT,
                
                -- Source & Platform Information
                source_type TEXT NOT NULL,
                source_id TEXT,
                affiliate_platform TEXT,
                
                -- Additional Metadata
                rating TEXT,
                review_count INTEGER,
                discount INTEGER,
                currency TEXT DEFAULT 'INR',
                gender TEXT,
                
                -- Display & Status
                is_active INTEGER DEFAULT 1,
                is_featured INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0,
                
                -- Page Display Configuration
                display_pages TEXT DEFAULT '["home"]',
                
                -- Timer functionality
                has_timer INTEGER DEFAULT 0,
                timer_duration INTEGER,
                timer_start_time INTEGER,
                
                -- Status for website display
                status TEXT DEFAULT 'active',
                source_channel TEXT,
                
                -- Timestamps
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        `;
        
        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('❌ Error creating unified_content table:', err.message);
                reject(err);
                return;
            }
            console.log('✅ unified_content table created successfully');
            resolve();
        });
    });
}

// Verify the table was created with correct schema
function verifyUnifiedContentTable() {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(unified_content)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error checking unified_content schema:', err.message);
                reject(err);
                return;
            }
            
            console.log('\n📋 unified_content table schema:');
            columns.forEach(col => {
                const nullable = col.notnull === 0 ? 'NULL' : 'NOT NULL';
                const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
                console.log(`   ${col.name}: ${col.type} ${nullable}${defaultVal}`);
            });
            
            console.log(`\n✅ Table created with ${columns.length} columns`);
            resolve();
        });
    });
}

// Check all tables now exist
function verifyAllTables() {
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('\n📊 All database tables:');
            tables.forEach(table => {
                console.log(`   - ${table.name}`);
            });
            
            // Check if our required tables exist
            const tableNames = tables.map(t => t.name);
            const requiredTables = ['channel_posts', 'affiliate_conversions', 'unified_content'];
            const missingTables = requiredTables.filter(table => !tableNames.includes(table));
            
            if (missingTables.length === 0) {
                console.log('\n🎉 All required bot tables are now present!');
            } else {
                console.log('\n❌ Still missing tables:', missingTables);
            }
            
            resolve();
        });
    });
}

// Main execution
async function main() {
    try {
        await createUnifiedContentTable();
        await verifyUnifiedContentTable();
        await verifyAllTables();
        
        console.log('\n🎉 Unified Content table setup complete!');
        console.log('\n💡 Database is now ready for bot operations:');
        console.log('   ✅ channel_posts - for storing Telegram messages');
        console.log('   ✅ affiliate_conversions - for tracking URL conversions');
        console.log('   ✅ unified_content - for website display content');
        console.log('\n🔄 Next: Restart the bot to begin message processing');
        
    } catch (error) {
        console.error('❌ Error during table creation:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            process.exit(0);
        });
    }
}

main();