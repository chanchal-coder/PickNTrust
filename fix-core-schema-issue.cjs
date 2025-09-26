const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 FIXING CORE SCHEMA ISSUE');
console.log('=' .repeat(50));

async function fixSchemaIssue() {
    try {
        // 1. Check current schema
        console.log('\n1️⃣ CHECKING CURRENT SCHEMA:');
        const currentSchema = db.prepare("PRAGMA table_info(channel_posts)").all();
        console.log('Current channel_posts columns:');
        currentSchema.forEach(col => {
            console.log(`   ${col.name}: ${col.type}`);
        });
        
        // 2. The bot expects camelCase but DB has snake_case
        console.log('\n2️⃣ SCHEMA MISMATCH IDENTIFIED:');
        console.log('❌ Bot expects: channelId, messageId, originalText, processedText, isProcessed, isPosted');
        console.log('❌ DB has: channel_id, message_id, original_text, processed_text, is_processed, is_posted');
        
        // 3. Create a new table with correct schema
        console.log('\n3️⃣ CREATING CORRECTED TABLE:');
        
        // Drop existing table
        db.prepare('DROP TABLE IF EXISTS channel_posts_old').run();
        db.prepare('ALTER TABLE channel_posts RENAME TO channel_posts_old').run();
        console.log('✅ Backed up existing table');
        
        // Create new table with bot-expected schema
        const createNewTable = `
            CREATE TABLE channel_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channelId TEXT NOT NULL,
                messageId INTEGER NOT NULL,
                originalText TEXT NOT NULL,
                processedText TEXT,
                isProcessed INTEGER DEFAULT 0,
                isPosted INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `;
        
        db.prepare(createNewTable).run();
        console.log('✅ Created new channel_posts table with correct schema');
        
        // 4. Migrate any existing data
        console.log('\n4️⃣ MIGRATING EXISTING DATA:');
        
        const existingData = db.prepare('SELECT * FROM channel_posts_old').all();
        console.log(`Found ${existingData.length} existing records to migrate`);
        
        if (existingData.length > 0) {
            const insertMigrated = db.prepare(`
                INSERT INTO channel_posts (channelId, messageId, originalText, processedText, isProcessed, isPosted, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            existingData.forEach(row => {
                insertMigrated.run(
                    row.channel_id || row.channelId,
                    row.message_id || row.messageId,
                    row.original_text || row.originalText,
                    row.processed_text || row.processedText,
                    row.is_processed || row.isProcessed || 0,
                    row.is_posted || row.isPosted || 0,
                    row.created_at || row.createdAt || new Date().toISOString(),
                    row.updated_at || row.updatedAt || new Date().toISOString()
                );
            });
            console.log(`✅ Migrated ${existingData.length} records`);
        }
        
        // 5. Test the new schema
        console.log('\n5️⃣ TESTING NEW SCHEMA:');
        
        const testInsert = db.prepare(`
            INSERT INTO channel_posts (channelId, messageId, originalText, processedText, isProcessed, isPosted, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const testResult = testInsert.run(
            '-1001234567890',
            999999,
            'TEST: Schema fix verification message',
            null,
            0,
            0,
            new Date().toISOString(),
            new Date().toISOString()
        );
        
        console.log('✅ Test insert successful:', testResult.lastInsertRowid);
        
        // 6. Verify the fix
        console.log('\n6️⃣ VERIFYING THE FIX:');
        
        const newSchema = db.prepare("PRAGMA table_info(channel_posts)").all();
        console.log('New channel_posts schema:');
        newSchema.forEach(col => {
            console.log(`   ✅ ${col.name}: ${col.type}`);
        });
        
        const testRecord = db.prepare('SELECT * FROM channel_posts WHERE id = ?').get(testResult.lastInsertRowid);
        console.log('\nTest record verification:');
        console.log(`   channelId: ${testRecord.channelId}`);
        console.log(`   messageId: ${testRecord.messageId}`);
        console.log(`   originalText: ${testRecord.originalText}`);
        console.log(`   isProcessed: ${testRecord.isProcessed}`);
        console.log(`   isPosted: ${testRecord.isPosted}`);
        
        // 7. Clean up test data
        db.prepare('DELETE FROM channel_posts WHERE id = ?').run(testResult.lastInsertRowid);
        console.log('✅ Cleaned up test data');
        
        console.log('\n🎯 CORE ISSUE FIXED!');
        console.log('=' .repeat(50));
        console.log('✅ Database schema now matches bot expectations');
        console.log('✅ Bot should now be able to save messages properly');
        console.log('✅ Ready for real message testing');
        
    } catch (error) {
        console.error('❌ ERROR fixing schema:', error.message);
        console.error('Stack:', error.stack);
    }
}

fixSchemaIssue();