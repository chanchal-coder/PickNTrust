const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'server', 'database.sqlite');

console.log('🔍 Checking Table Schema...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database\n');
});

// Check channel_posts table schema
function checkChannelPostsSchema() {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(channel_posts)", [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('📋 channel_posts Table Schema:');
            if (rows.length === 0) {
                console.log('   ❌ Table exists but has no columns defined!');
            } else {
                rows.forEach(row => {
                    console.log(`   ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - ${row.pk ? 'PRIMARY KEY' : ''}`);
                });
            }
            resolve(rows);
        });
    });
}

// Check unified_content table schema
function checkUnifiedContentSchema() {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(unified_content)", [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('\n📋 unified_content Table Schema:');
            if (rows.length === 0) {
                console.log('   ❌ Table exists but has no columns defined!');
            } else {
                rows.forEach(row => {
                    console.log(`   ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - ${row.pk ? 'PRIMARY KEY' : ''}`);
                });
            }
            resolve(rows);
        });
    });
}

// Check actual data in channel_posts
function checkChannelPostsData() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM channel_posts LIMIT 5", [], (err, rows) => {
            if (err) {
                console.log('\n❌ Error querying channel_posts:', err.message);
                reject(err);
                return;
            }
            
            console.log('\n📊 Sample channel_posts Data:');
            if (rows.length === 0) {
                console.log('   📭 No data in channel_posts table');
            } else {
                rows.forEach((row, index) => {
                    console.log(`   Row ${index + 1}:`, JSON.stringify(row, null, 2));
                });
            }
            resolve(rows);
        });
    });
}

// Check actual data in unified_content
function checkUnifiedContentData() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM unified_content LIMIT 3", [], (err, rows) => {
            if (err) {
                console.log('\n❌ Error querying unified_content:', err.message);
                reject(err);
                return;
            }
            
            console.log('\n📊 Sample unified_content Data:');
            if (rows.length === 0) {
                console.log('   📭 No data in unified_content table');
            } else {
                rows.forEach((row, index) => {
                    console.log(`   Row ${index + 1}:`, JSON.stringify(row, null, 2));
                });
            }
            resolve(rows);
        });
    });
}

// Main execution
async function main() {
    try {
        await checkChannelPostsSchema();
        await checkUnifiedContentSchema();
        await checkChannelPostsData();
        await checkUnifiedContentData();
        
        console.log('\n🔍 Schema Analysis Complete!');
        
    } catch (error) {
        console.error('❌ Error during analysis:', error);
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