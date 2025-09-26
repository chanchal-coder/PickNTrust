const Database = require('better-sqlite3');

console.log('🔍 CHECKING DATABASE SCHEMA MISMATCH');
console.log('=====================================');

try {
    const db = new Database('./pickntrust.db');
    
    // Check existing tables
    console.log('\n📋 EXISTING TABLES:');
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    tables.forEach(t => console.log(`- ${t.name}`));
    
    // Check unified_content table schema if it exists
    const unifiedContentExists = tables.find(t => t.name === 'unified_content');
    if (unifiedContentExists) {
        console.log('\n📊 UNIFIED_CONTENT TABLE SCHEMA:');
        const schema = db.prepare('PRAGMA table_info(unified_content)').all();
        schema.forEach(col => {
            console.log(`${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ' DEFAULT ' + col.dflt_value : ''}`);
        });
        
        // Check for specific columns the bot is trying to use
        const requiredColumns = ['affiliate_url', 'content', 'display_pages', 'source_platform', 'source_id', 'media_urls', 'status', 'visibility', 'processing_status', 'created_at', 'updated_at'];
        console.log('\n🔍 CHECKING REQUIRED COLUMNS:');
        requiredColumns.forEach(col => {
            const exists = schema.find(s => s.name === col);
            if (exists) {
                console.log(`✅ ${col}: ${exists.type}${exists.notnull ? ' NOT NULL' : ''}`);
            } else {
                console.log(`❌ ${col}: MISSING`);
            }
        });
        
    } else {
        console.log('\n❌ unified_content table does not exist!');
    }
    
    db.close();
    
} catch (error) {
    console.error('❌ Error:', error.message);
}