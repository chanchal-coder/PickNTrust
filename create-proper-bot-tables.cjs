const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'server', 'database.sqlite');

console.log('🔧 Creating Proper Bot Tables...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database\n');
});

// Create channel_posts table with proper schema
function createChannelPostsTable() {
    return new Promise((resolve, reject) => {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS channel_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id TEXT NOT NULL,
                channel_name TEXT NOT NULL,
                website_page TEXT NOT NULL,
                message_id INTEGER NOT NULL,
                original_text TEXT NOT NULL,
                processed_text TEXT NOT NULL,
                extracted_urls TEXT,
                is_processed INTEGER DEFAULT 0,
                is_posted INTEGER DEFAULT 0,
                processing_error TEXT,
                telegram_timestamp INTEGER,
                processed_at INTEGER,
                posted_at INTEGER,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        `;
        
        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('❌ Error creating channel_posts table:', err.message);
                reject(err);
                return;
            }
            console.log('✅ channel_posts table created successfully');
            resolve();
        });
    });
}

// Create affiliate_conversions table with proper schema
function createAffiliateConversionsTable() {
    return new Promise((resolve, reject) => {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS affiliate_conversions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_post_id INTEGER,
                original_url TEXT NOT NULL,
                affiliate_url TEXT NOT NULL,
                platform TEXT NOT NULL,
                conversion_success INTEGER NOT NULL,
                conversion_error TEXT,
                click_count INTEGER DEFAULT 0,
                conversion_count INTEGER DEFAULT 0,
                revenue TEXT DEFAULT '0',
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (channel_post_id) REFERENCES channel_posts(id)
            )
        `;
        
        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('❌ Error creating affiliate_conversions table:', err.message);
                reject(err);
                return;
            }
            console.log('✅ affiliate_conversions table created successfully');
            resolve();
        });
    });
}

// Update unified_content table to match proper schema
function updateUnifiedContentTable() {
    return new Promise((resolve, reject) => {
        // First check if the table has the correct columns
        db.all("PRAGMA table_info(unified_content)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error checking unified_content schema:', err.message);
                reject(err);
                return;
            }
            
            const columnNames = columns.map(col => col.name);
            console.log('📋 Current unified_content columns:', columnNames);
            
            // Check if we have the essential columns
            const requiredColumns = ['status', 'source_channel', 'is_active'];
            const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
            
            if (missingColumns.length > 0) {
                console.log('⚠️  Missing columns in unified_content:', missingColumns);
                
                // Add missing columns
                const alterPromises = missingColumns.map(column => {
                    return new Promise((resolveAlter, rejectAlter) => {
                        let alterSQL = '';
                        switch(column) {
                            case 'status':
                                alterSQL = `ALTER TABLE unified_content ADD COLUMN status TEXT DEFAULT 'active'`;
                                break;
                            case 'source_channel':
                                alterSQL = `ALTER TABLE unified_content ADD COLUMN source_channel TEXT`;
                                break;
                            case 'is_active':
                                alterSQL = `ALTER TABLE unified_content ADD COLUMN is_active INTEGER DEFAULT 1`;
                                break;
                        }
                        
                        db.run(alterSQL, (alterErr) => {
                            if (alterErr) {
                                console.error(`❌ Error adding ${column} column:`, alterErr.message);
                                rejectAlter(alterErr);
                                return;
                            }
                            console.log(`✅ Added ${column} column to unified_content`);
                            resolveAlter();
                        });
                    });
                });
                
                Promise.all(alterPromises)
                    .then(() => {
                        console.log('✅ unified_content table updated successfully');
                        resolve();
                    })
                    .catch(reject);
            } else {
                console.log('✅ unified_content table already has required columns');
                resolve();
            }
        });
    });
}

// Verify tables were created properly
function verifyTables() {
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
                console.log('\n✅ All required bot tables are present!');
            } else {
                console.log('\n❌ Missing tables:', missingTables);
            }
            
            resolve();
        });
    });
}

// Main execution
async function main() {
    try {
        await createChannelPostsTable();
        await createAffiliateConversionsTable();
        await updateUnifiedContentTable();
        await verifyTables();
        
        console.log('\n🎉 Bot tables setup complete!');
        console.log('\n💡 Next steps:');
        console.log('   1. Restart the Telegram bot');
        console.log('   2. Send a test message to a monitored channel');
        console.log('   3. Check if messages are being saved to channel_posts');
        console.log('   4. Verify processing to unified_content');
        
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