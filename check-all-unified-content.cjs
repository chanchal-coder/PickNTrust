const Database = require('better-sqlite3');
const path = require('path');

// Database configuration - using SQLite
const dbPath = path.join(__dirname, 'database.sqlite');

async function checkAllUnifiedContent() {
    console.log('🔍 CHECKING ALL UNIFIED CONTENT');
    console.log('================================');
    
    try {
        const db = new Database(dbPath);
        console.log('✅ Database connected');
        
        // Get all records from unified_content
        const rows = db.prepare('SELECT * FROM unified_content ORDER BY id DESC').all();
        
        console.log(`\n📊 Total records in unified_content: ${rows.length}`);
        
        if (rows.length === 0) {
            console.log('❌ No records found in unified_content table!');
        } else {
            console.log('\n📋 All Records:');
            console.log('===============');
            
            rows.forEach((row, index) => {
                console.log(`\n${index + 1}. ID: ${row.id}`);
                console.log(`   Title: ${row.title || 'NULL'}`);
                console.log(`   Description: ${row.description ? row.description.substring(0, 50) + '...' : 'NULL'}`);
                console.log(`   Category: ${row.category || 'NULL'}`);
                console.log(`   Subcategory: ${row.subcategory || 'NULL'}`);
                console.log(`   Status: ${row.status || 'NULL'}`);
                console.log(`   Featured Image: ${row.featured_image || 'NULL'}`);
                console.log(`   Media URLs: ${row.media_urls || 'NULL'}`);
                console.log(`   Affiliate URLs: ${row.affiliate_urls || 'NULL'}`);
                console.log(`   Content: ${row.content || 'NULL'}`);
                console.log(`   Created: ${row.created_at || 'NULL'}`);
            });
        }
        
        // Check table structure
        console.log('\n🏗️ Table Structure:');
        console.log('===================');
        const columns = db.prepare('PRAGMA table_info(unified_content)').all();
        columns.forEach(col => {
            console.log(`   ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
        });
        
        db.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAllUnifiedContent();