const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - root directory
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔍 Checking Root Database...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to root SQLite database\n');
});

// Check channel_posts data
function checkChannelPostsData() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM channel_posts ORDER BY id DESC LIMIT 5", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                console.log('📊 Recent channel_posts Data:');
                if (rows.length === 0) {
                    console.log('   📭 No data in channel_posts table');
                } else {
                    rows.forEach(row => {
                        console.log(`   📝 ID: ${row.id}, Channel: ${row.channel_name}, Message: ${row.message_id}`);
                        console.log(`       Text: ${row.original_text?.substring(0, 100)}...`);
                        console.log(`       Processed: ${row.is_processed}, Posted: ${row.is_posted}`);
                        console.log('');
                    });
                }
                resolve();
            }
        });
    });
}

// Check unified_content data
function checkUnifiedContentData() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM unified_content ORDER BY id DESC LIMIT 5", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                console.log('📊 Recent unified_content Data:');
                if (rows.length === 0) {
                    console.log('   📭 No data in unified_content table');
                } else {
                    rows.forEach(row => {
                        console.log(`   📝 ID: ${row.id}, Title: ${row.title?.substring(0, 50)}...`);
                        console.log(`       Page: ${row.page_type}, Source: ${row.source_type}`);
                        console.log('');
                    });
                }
                resolve();
            }
        });
    });
}

async function main() {
    try {
        await checkChannelPostsData();
        await checkUnifiedContentData();
        console.log('🔍 Root Database Analysis Complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close();
    }
}

main();