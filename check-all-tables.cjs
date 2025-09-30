/**
 * Check All Tables in sqlite.db
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('🔍 Checking All Tables in sqlite.db...');
console.log('=' .repeat(50));

try {
    // Get all table names
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `).all();
    
    console.log(`\n📋 Found ${tables.length} tables:`);
    tables.forEach(table => {
        console.log(`   • ${table.name}`);
    });
    
    // Check each table's data
    for (const table of tables) {
        console.log(`\n📊 Table: ${table.name}`);
        console.log('-'.repeat(30));
        
        try {
            // Get row count
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
            console.log(`   Records: ${count.count}`);
            
            // Get schema
            const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
            console.log(`   Columns: ${schema.map(col => col.name).join(', ')}`);
            
            // Show sample data if exists
            if (count.count > 0) {
                const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 3`).all();
                console.log(`   Sample data:`);
                sample.forEach((row, index) => {
                    console.log(`     Row ${index + 1}:`, JSON.stringify(row, null, 2));
                });
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}