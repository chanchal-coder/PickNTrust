const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Creating Unified Content Table in Bot Database...');

try {
    // Use the same database file as the bot
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    console.log('✅ Connected to bot database:', dbPath);
    
    // Create unified_content table with schema matching bot insertion code
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS unified_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            price TEXT,
            original_price TEXT,
            image_url TEXT NOT NULL,
            affiliate_url TEXT NOT NULL,
            content_type TEXT NOT NULL,
            page_type TEXT NOT NULL,
            category TEXT NOT NULL,
            source_type TEXT NOT NULL,
            source_id TEXT,
            discount INTEGER,
            display_pages TEXT DEFAULT '["prime-picks"]',
            status TEXT DEFAULT 'active',
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `;
    
    db.exec(createTableSQL);
    console.log('✅ unified_content table created successfully');
    
    // Verify table structure
    const schema = db.prepare('PRAGMA table_info(unified_content)').all();
    console.log('\n📋 unified_content table schema:');
    schema.forEach(col => {
        console.log(`   ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ' DEFAULT ' + col.dflt_value : ''}`);
    });
    
    console.log(`\n✅ Table created with ${schema.length} columns`);
    
    // Check all tables in database
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    console.log('\n📊 All database tables:');
    tables.forEach(t => console.log(`   - ${t.name}`));
    
    db.close();
    console.log('\n🎉 Bot database setup complete!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}