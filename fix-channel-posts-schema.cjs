const Database = require('better-sqlite3');

console.log('🔧 FIXING CHANNEL_POSTS TABLE SCHEMA');
console.log('=====================================\n');

try {
  const db = new Database('database.sqlite');
  
  // Step 1: Check current schema
  console.log('1️⃣ Current channel_posts schema:');
  const currentSchema = db.prepare('PRAGMA table_info(channel_posts)').all();
  currentSchema.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
  });
  
  // Step 2: Backup existing data
  console.log('\n2️⃣ Backing up existing data...');
  const existingData = db.prepare('SELECT * FROM channel_posts').all();
  console.log(`Found ${existingData.length} existing records`);
  
  // Step 3: Drop old table and create new one with correct schema
  console.log('\n3️⃣ Recreating table with correct schema...');
  
  db.exec('DROP TABLE IF EXISTS channel_posts_backup');
  db.exec('ALTER TABLE channel_posts RENAME TO channel_posts_backup');
  
  // Create new table with correct schema matching telegram-bot.ts expectations
  db.exec(`
    CREATE TABLE channel_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      website_page TEXT NOT NULL,
      message_id INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      processed_text TEXT NOT NULL,
      extracted_urls TEXT,
      image_url TEXT,
      is_processed INTEGER DEFAULT 0,
      is_posted INTEGER DEFAULT 0,
      processing_error TEXT,
      telegram_timestamp INTEGER,
      processed_at INTEGER,
      posted_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  console.log('✅ New table created with correct schema');
  
  // Step 4: Migrate existing data if any
  if (existingData.length > 0) {
    console.log('\n4️⃣ Migrating existing data...');
    
    const insertStmt = db.prepare(`
      INSERT INTO channel_posts (
        channel_id, channel_name, website_page, message_id, original_text,
        processed_text, is_processed, is_posted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let migrated = 0;
    for (const row of existingData) {
      try {
        insertStmt.run(
          row.channelId || row.channel_id || 'unknown',
          'Migrated Channel',
          'migrated-page',
          row.messageId || row.message_id || 0,
          row.originalText || row.original_text || '',
          row.processedText || row.processed_text || '',
          row.isProcessed || row.is_processed || 0,
          row.isPosted || row.is_posted || 0,
          Math.floor(new Date(row.createdAt || row.created_at || Date.now()).getTime() / 1000)
        );
        migrated++;
      } catch (error) {
        console.log(`⚠️ Failed to migrate record ${row.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Migrated ${migrated}/${existingData.length} records`);
  }
  
  // Step 5: Verify new schema
  console.log('\n5️⃣ New channel_posts schema:');
  const newSchema = db.prepare('PRAGMA table_info(channel_posts)').all();
  newSchema.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  const count = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
  console.log(`\n📊 Final record count: ${count.count}`);
  
  db.close();
  console.log('\n✅ Channel posts schema fix completed successfully!');
  
} catch (error) {
  console.error('❌ Error fixing schema:', error.message);
  process.exit(1);
}